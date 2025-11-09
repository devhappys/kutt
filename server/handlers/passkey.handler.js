const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');

const query = require('../queries');
const utils = require('../utils');
const env = require('../env');

const CustomError = utils.CustomError;

// Configuration for WebAuthn
const rpName = env.SITE_NAME || 'Kutt';
const rpID = env.PASSKEY_RP_ID || process.env.PASSKEY_RP_ID || 'localhost';
const origin = env.PASSKEY_ORIGIN || process.env.PASSKEY_ORIGIN || `http://localhost:${env.PORT || 3000}`;

// Store challenges temporarily (in production, use Redis)
const challenges = new Map();

/**
 * Initialize passkey registration
 * Generate registration options for the user
 */
async function registerInit(req, res) {
  const user = req.user;

  try {
    // Get existing passkeys for this user
    const userPasskeys = await query.passkey.getByUserId(user.id);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Uint8Array.from(user.id.toString(), c => c.charCodeAt(0)),
      userName: user.email,
      userDisplayName: user.email,
      // Don't prompt users for additional information about the authenticator
      attestationType: 'none',
      // Prevent re-registration of existing passkeys
      excludeCredentials: userPasskeys.map(passkey => ({
        id: Buffer.from(passkey.credential_id, 'base64url'),
        type: 'public-key',
        transports: passkey.transports ? passkey.transports.split(',') : undefined,
      })),
      authenticatorSelection: {
        // Try to use platform authenticators (like Windows Hello, Face ID, Touch ID)
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge temporarily (in production, store in Redis with expiration)
    challenges.set(user.id, options.challenge);

    return res.status(200).send(options);
  } catch (error) {
    console.error('Passkey registration init error:', error);
    throw new CustomError('Failed to initialize passkey registration.', 500);
  }
}

/**
 * Complete passkey registration
 * Verify and store the new passkey
 */
async function registerVerify(req, res) {
  const user = req.user;
  const { credential, name } = req.body;

  if (!credential || !name) {
    throw new CustomError('Credential and name are required.', 400);
  }

  try {
    const expectedChallenge = challenges.get(user.id);
    if (!expectedChallenge) {
      throw new CustomError('Challenge not found or expired.', 400);
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: [origin],
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new CustomError('Passkey verification failed.', 400);
    }

    const { credential: credentialInfo } = verification.registrationInfo;
    const { credentialPublicKey, credentialID, counter } = credentialInfo;

    // Store the passkey in database
    const passkey = await query.passkey.add({
      id: nanoid(),
      user_id: user.id,
      name: name.trim(),
      credential_id: Buffer.from(credentialID).toString('base64url'),
      credential_public_key: Buffer.from(credentialPublicKey).toString('base64url'),
      counter,
      transports: credential.response.transports ? credential.response.transports.join(',') : null,
    });

    // Enable passkey 2FA for the user
    const passkeyCount = await query.passkey.countByUserId(user.id);
    if (passkeyCount === 1) {
      await query.user.update({ id: user.id }, { passkey_enabled: true });
    }

    // Clean up challenge
    challenges.delete(user.id);

    return res.status(200).send({
      success: true,
      message: 'Passkey registered successfully.',
      passkey: {
        id: passkey.id,
        name: passkey.name,
        created_at: passkey.created_at,
      },
    });
  } catch (error) {
    console.error('Passkey registration verify error:', error);
    challenges.delete(user.id);
    throw new CustomError(error.message || 'Failed to verify passkey registration.', 400);
  }
}

/**
 * Initialize passkey authentication
 * Generate authentication options
 */
async function authenticateInit(req, res) {
  const { email } = req.body;

  if (!email) {
    throw new CustomError('Email is required.', 400);
  }

  try {
    const user = await query.user.find({ email });
    if (!user) {
      // Don't reveal if user exists
      throw new CustomError('Authentication failed.', 401);
    }

    if (!user.passkey_enabled) {
      throw new CustomError('Passkey authentication is not enabled for this account.', 400);
    }

    const userPasskeys = await query.passkey.getByUserId(user.id);
    if (userPasskeys.length === 0) {
      throw new CustomError('No passkeys found for this account.', 400);
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userPasskeys.map(passkey => ({
        id: Buffer.from(passkey.credential_id, 'base64url'),
        type: 'public-key',
        transports: passkey.transports ? passkey.transports.split(',') : undefined,
      })),
      userVerification: 'preferred',
    });

    // Store challenge temporarily
    challenges.set(`auth_${email}`, {
      challenge: options.challenge,
      userId: user.id,
    });

    return res.status(200).send(options);
  } catch (error) {
    console.error('Passkey authentication init error:', error);
    throw new CustomError(error.message || 'Failed to initialize passkey authentication.', 400);
  }
}

/**
 * Complete passkey authentication
 * Verify passkey and issue JWT token
 */
async function authenticateVerify(req, res) {
  const { email, credential } = req.body;

  if (!email || !credential) {
    throw new CustomError('Email and credential are required.', 400);
  }

  try {
    const challengeData = challenges.get(`auth_${email}`);
    if (!challengeData) {
      throw new CustomError('Challenge not found or expired.', 400);
    }

    const { challenge, userId } = challengeData;

    // Find the passkey
    const credentialID = Buffer.from(credential.id, 'base64url').toString('base64url');
    const passkey = await query.passkey.findByCredentialId(credentialID);

    if (!passkey || passkey.user_id !== userId) {
      throw new CustomError('Passkey not found.', 404);
    }

    // Get user
    const user = await query.user.find({ id: userId });
    if (!user) {
      throw new CustomError('User not found.', 404);
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: [origin],
      expectedRPID: rpID,
      credential: {
        id: Buffer.from(passkey.credential_id, 'base64url'),
        publicKey: Buffer.from(passkey.credential_public_key, 'base64url'),
        counter: passkey.counter,
        transports: passkey.transports ? passkey.transports.split(',') : undefined,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      throw new CustomError('Passkey verification failed.', 401);
    }

    // Update passkey counter and last used
    const newCounter = verification.authenticationInfo?.counter ?? passkey.counter + 1;
    await query.passkey.updateLastUsed(passkey.id, newCounter);

    // Generate JWT token
    const token = utils.signToken(user);

    // Generate API key if user doesn't have one
    if (!user.apikey) {
      const apikey = nanoid(40);
      const updatedUser = await query.user.update({ id: user.id }, { apikey });

      challenges.delete(`auth_${email}`);

      return res.status(200).send({
        token,
        user: utils.sanitize.user(updatedUser),
        apikey: updatedUser.apikey,
      });
    }

    challenges.delete(`auth_${email}`);

    return res.status(200).send({
      token,
      user: utils.sanitize.user(user),
      apikey: user.apikey,
    });
  } catch (error) {
    console.error('Passkey authentication verify error:', error);
    challenges.delete(`auth_${email}`);
    throw new CustomError(error.message || 'Failed to verify passkey authentication.', 401);
  }
}

/**
 * Get all passkeys for the authenticated user
 */
async function list(req, res) {
  const user = req.user;

  try {
    const passkeys = await query.passkey.getByUserId(user.id);

    const sanitizedPasskeys = passkeys.map(passkey => ({
      id: passkey.id,
      name: passkey.name,
      created_at: passkey.created_at,
      last_used: passkey.last_used,
      transports: passkey.transports ? passkey.transports.split(',') : [],
    }));

    return res.status(200).send({
      passkeys: sanitizedPasskeys,
    });
  } catch (error) {
    console.error('Passkey list error:', error);
    throw new CustomError('Failed to retrieve passkeys.', 500);
  }
}

/**
 * Delete a passkey
 */
async function remove(req, res) {
  const user = req.user;
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new CustomError('Password is required to delete a passkey.', 400);
  }

  try {
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError('Password is incorrect.', 401);
    }

    // Delete the passkey
    const result = await query.passkey.remove({ id, user_id: user.id });
    if (result.error) {
      throw new CustomError(result.error, 404);
    }

    // Check if user has any passkeys left
    const remainingCount = await query.passkey.countByUserId(user.id);
    if (remainingCount === 0) {
      // Disable passkey 2FA
      await query.user.update({ id: user.id }, { passkey_enabled: false });
    }

    return res.status(200).send({
      message: 'Passkey deleted successfully.',
    });
  } catch (error) {
    console.error('Passkey delete error:', error);
    throw new CustomError(error.message || 'Failed to delete passkey.', 500);
  }
}

/**
 * Rename a passkey
 */
async function rename(req, res) {
  const user = req.user;
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    throw new CustomError('Name is required.', 400);
  }

  try {
    const passkey = await query.passkey.update(
      { id, user_id: user.id },
      { name: name.trim() }
    );

    if (!passkey) {
      throw new CustomError('Passkey not found.', 404);
    }

    return res.status(200).send({
      message: 'Passkey renamed successfully.',
      passkey: {
        id: passkey.id,
        name: passkey.name,
      },
    });
  } catch (error) {
    console.error('Passkey rename error:', error);
    throw new CustomError(error.message || 'Failed to rename passkey.', 500);
  }
}

/**
 * Get passkey status
 */
async function getStatus(req, res) {
  const user = req.user;

  try {
    const passkeyCount = await query.passkey.countByUserId(user.id);

    return res.status(200).send({
      enabled: user.passkey_enabled || false,
      count: passkeyCount,
    });
  } catch (error) {
    console.error('Passkey status error:', error);
    throw new CustomError('Failed to retrieve passkey status.', 500);
  }
}

module.exports = {
  registerInit,
  registerVerify,
  authenticateInit,
  authenticateVerify,
  list,
  remove,
  rename,
  getStatus,
};
