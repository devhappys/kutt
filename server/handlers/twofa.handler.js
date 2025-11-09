const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { nanoid } = require("nanoid");

const query = require("../queries");
const utils = require("../utils");
const env = require("../env");

const CustomError = utils.CustomError;

/**
 * Setup 2FA - Generate secret and QR code
 */
async function setup(req, res) {
  const user = req.user;
  
  // Check if 2FA columns exist (database migration check)
  try {
    const testUser = await query.user.find({ id: user.id });
    if (testUser && !('twofa_enabled' in testUser)) {
      throw new CustomError("Two-factor authentication is not available. Database migration required.", 503);
    }
  } catch (error) {
    if (error.message.includes('Unknown column')) {
      throw new CustomError("Two-factor authentication is not available. Please run database migrations.", 503);
    }
    throw error;
  }
  
  // Check if 2FA is already enabled
  if (user.twofa_enabled) {
    throw new CustomError("Two-factor authentication is already enabled.", 400);
  }

  // Generate a secret for the user
  const secret = speakeasy.generateSecret({
    name: `Hapxs SUrl (${user.email})`,
    issuer: env.SITE_NAME || "Hapxs SUrl"
  });

  // Generate QR code data URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Store the secret temporarily (not enabled yet, needs verification)
  await query.user.update(
    { id: user.id },
    { twofa_secret: secret.base32 }
  );

  return res.status(200).send({
    secret: secret.base32,
    qrCode: qrCodeUrl,
    message: "Scan this QR code with your authenticator app, then verify with a code."
  });
}

/**
 * Verify 2FA setup and enable it
 */
async function verify(req, res) {
  const user = req.user;
  const { token } = req.body;

  if (!user.twofa_secret) {
    throw new CustomError("Two-factor authentication setup not initiated.", 400);
  }

  if (user.twofa_enabled) {
    throw new CustomError("Two-factor authentication is already enabled.", 400);
  }

  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: user.twofa_secret,
    encoding: "base32",
    token: token,
    window: 2
  });

  if (!verified) {
    throw new CustomError("Invalid verification code. Please try again.", 400);
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Enable 2FA
  await query.user.update(
    { id: user.id },
    {
      twofa_enabled: true,
      twofa_backup_codes: JSON.stringify(backupCodes)
    }
  );

  return res.status(200).send({
    message: "Two-factor authentication has been enabled successfully.",
    backupCodes
  });
}

/**
 * Disable 2FA
 */
async function disable(req, res) {
  const user = req.user;
  const { password } = req.body;

  if (!user.twofa_enabled) {
    throw new CustomError("Two-factor authentication is not enabled.", 400);
  }

  // Verify password
  const bcrypt = require("bcryptjs");
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new CustomError("Password is incorrect.", 401);
  }

  // Disable 2FA
  await query.user.update(
    { id: user.id },
    {
      twofa_enabled: false,
      twofa_secret: null,
      twofa_backup_codes: null
    }
  );

  return res.status(200).send({
    message: "Two-factor authentication has been disabled."
  });
}

/**
 * Verify 2FA token during login
 */
async function verifyToken(req, res) {
  const { email, token, isBackupCode } = req.body;

  const user = await query.user.find({ email });

  if (!user) {
    throw new CustomError("User not found.", 404);
  }

  if (!user.twofa_enabled) {
    throw new CustomError("Two-factor authentication is not enabled for this account.", 400);
  }

  let verified = false;

  if (isBackupCode) {
    // Verify backup code
    verified = await verifyBackupCode(user, token);
  } else {
    // Verify TOTP token
    verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: "base32",
      token: token,
      window: 2
    });
  }

  if (!verified) {
    throw new CustomError("Invalid verification code.", 401);
  }

  // Generate JWT token
  const jwtToken = utils.signToken(user);

  // Generate API key if user doesn't have one
  if (!user.apikey) {
    const apikey = nanoid(40);
    const updatedUser = await query.user.update({ id: user.id }, { apikey });

    return res.status(200).send({
      token: jwtToken,
      user: utils.sanitize.user(updatedUser),
      apikey: updatedUser.apikey
    });
  }

  return res.status(200).send({
    token: jwtToken,
    user: utils.sanitize.user(user),
    apikey: user.apikey
  });
}

/**
 * Check if 2FA is required for login
 */
async function checkRequired(req, res) {
  const { email } = req.body;

  const user = await query.user.find({ email });

  if (!user) {
    // Don't reveal if user exists
    return res.status(200).send({ required: false });
  }

  return res.status(200).send({
    required: user.twofa_enabled || false
  });
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = nanoid(8).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify and consume backup code
 */
async function verifyBackupCode(user, code) {
  if (!user.twofa_backup_codes) {
    return false;
  }

  try {
    const backupCodes = JSON.parse(user.twofa_backup_codes);
    const codeIndex = backupCodes.indexOf(code.toUpperCase());

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);

    // Update user's backup codes
    await query.user.update(
      { id: user.id },
      { twofa_backup_codes: JSON.stringify(backupCodes) }
    );

    return true;
  } catch (error) {
    console.error("Error verifying backup code:", error);
    return false;
  }
}

/**
 * Regenerate backup codes
 */
async function regenerateBackupCodes(req, res) {
  const user = req.user;

  if (!user.twofa_enabled) {
    throw new CustomError("Two-factor authentication is not enabled.", 400);
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes();

  // Update user's backup codes
  await query.user.update(
    { id: user.id },
    { twofa_backup_codes: JSON.stringify(backupCodes) }
  );

  return res.status(200).send({
    message: "Backup codes have been regenerated.",
    backupCodes
  });
}

/**
 * Get 2FA status
 */
async function getStatus(req, res) {
  const user = req.user;
  
  // Check if 2FA columns exist (database migration check)
  if (!('twofa_enabled' in user)) {
    return res.status(200).send({
      enabled: false,
      backupCodesCount: 0,
      migrationRequired: true
    });
  }
  
  let backupCodesCount = 0;
  if (user.twofa_enabled && user.twofa_backup_codes) {
    try {
      const codes = JSON.parse(user.twofa_backup_codes);
      backupCodesCount = codes.length;
    } catch (error) {
      // Ignore parse error
    }
  }
  
  return res.status(200).send({
    enabled: user.twofa_enabled || false,
    backupCodesCount
  });
}

module.exports = {
  setup,
  verify,
  disable,
  verifyToken,
  checkRequired,
  regenerateBackupCodes,
  getStatus
};
