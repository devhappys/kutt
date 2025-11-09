const { Router } = require("express");

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../handlers/auth.handler");
const security = require("../handlers/security.handler");

const router = Router();

// ==================== IP Rules ====================

// Get IP rules for a link
router.get(
  "/links/:linkId/ip-rules",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.getIPRules)
);

// Add IP rule
router.post(
  "/links/:linkId/ip-rules",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.addIPRule)
);

// Update IP rule
router.patch(
  "/ip-rules/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.updateIPRule)
);

// Delete IP rule
router.delete(
  "/ip-rules/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.deleteIPRule)
);

// ==================== Geo Restrictions ====================

// Get geo restrictions for a link
router.get(
  "/links/:linkId/geo-restrictions",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.getGeoRestrictions)
);

// Add geo restriction
router.post(
  "/links/:linkId/geo-restrictions",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.addGeoRestriction)
);

// Delete geo restriction
router.delete(
  "/geo-restrictions/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.deleteGeoRestriction)
);

// ==================== Rate Limit Rules ====================

// Get rate limit rules for a link
router.get(
  "/links/:linkId/rate-limits",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.getRateLimitRules)
);

// Add rate limit rule
router.post(
  "/links/:linkId/rate-limits",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.addRateLimitRule)
);

// Delete rate limit rule
router.delete(
  "/rate-limits/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.deleteRateLimitRule)
);

// ==================== Smart Redirect Rules ====================

// Get redirect rules for a link
router.get(
  "/links/:linkId/redirect-rules",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.getRedirectRules)
);

// Add redirect rule
router.post(
  "/links/:linkId/redirect-rules",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.addRedirectRule)
);

// Update redirect rule
router.patch(
  "/redirect-rules/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.updateRedirectRule)
);

// Delete redirect rule
router.delete(
  "/redirect-rules/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(security.deleteRedirectRule)
);

module.exports = router;
