const { Router } = require("express");

const health = require("../handlers/health.handler");
const auth = require("../handlers/auth.handler");
const asyncHandler = require("../utils/asyncHandler");

const router = Router();

// Public health check endpoint
router.get("/", asyncHandler(health.healthCheck));

// Detailed memory stats (admin only)
router.get(
  "/memory",
  asyncHandler(auth.jwt),
  asyncHandler(auth.admin),
  asyncHandler(health.memoryStats)
);

// Performance stats (admin only)
router.get(
  "/performance",
  asyncHandler(auth.jwt),
  asyncHandler(auth.admin),
  asyncHandler(health.performanceStats)
);

// Manual garbage collection trigger (admin only)
router.post(
  "/gc",
  asyncHandler(auth.jwt),
  asyncHandler(auth.admin),
  asyncHandler(health.triggerGC)
);

// Clear caches manually (admin only)
router.post(
  "/clear-cache",
  asyncHandler(auth.jwt),
  asyncHandler(auth.admin),
  asyncHandler(health.clearCaches)
);

module.exports = router;
