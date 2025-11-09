const { Router } = require("express");

const validators = require("../handlers/validators.handler");
const helpers = require("../handlers/helpers.handler");
const asyncHandler = require("../utils/asyncHandler");
const locals = require("../handlers/locals.handler");
const auth = require("../handlers/auth.handler");
const utils = require("../utils");
const env = require("../env");

const router = Router();

router.post(
  "/login",
  validators.login,
  asyncHandler(helpers.verify),
  helpers.rateLimit({ window: 60, limit: 5 }),
  asyncHandler(auth.local),
  asyncHandler(auth.login)
);

router.post(
  "/signup",
  auth.featureAccess([!env.DISALLOW_REGISTRATION, env.MAIL_ENABLED]),
  validators.signup,
  asyncHandler(helpers.verify),
  helpers.rateLimit({ window: 60, limit: 5 }),
  validators.signupEmailTaken,
  asyncHandler(helpers.verify),
  asyncHandler(auth.signup)
);

router.post(
  "/create-admin",
  validators.createAdmin,
  asyncHandler(helpers.verify),
  helpers.rateLimit({ window: 60, limit: 5 }),
  asyncHandler(auth.createAdminUser)
);

router.post(
  "/change-password",
  asyncHandler(auth.jwt),
  validators.changePassword,
  asyncHandler(helpers.verify),
  helpers.rateLimit({ window: 60, limit: 5 }),
  asyncHandler(auth.changePassword)
);

router.post(
  "/change-email",
  asyncHandler(auth.jwt),
  auth.featureAccess([env.MAIL_ENABLED]),
  validators.changeEmail,
  asyncHandler(helpers.verify),
  helpers.rateLimit({ window: 60, limit: 3 }),
  asyncHandler(auth.changeEmailRequest)
);

router.post(
  "/apikey",
  asyncHandler(auth.jwt),
  helpers.rateLimit({ window: 60, limit: 10 }),
  asyncHandler(auth.generateApiKey)
);

router.post(
  "/reset-password",
  auth.featureAccess([env.MAIL_ENABLED]),
  validators.resetPassword,
  asyncHandler(helpers.verify),
  helpers.rateLimit({ window: 60, limit: 3 }),
  asyncHandler(auth.resetPassword)
);

router.post(
  "/new-password",
  locals.newPassword,
  validators.newPassword,
  asyncHandler(helpers.verify),
  helpers.rateLimit({ window: 60, limit: 5 }),
  asyncHandler(auth.newPassword)
);

module.exports = router;
