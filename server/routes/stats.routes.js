const { Router } = require("express");

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../handlers/auth.handler");
const stats = require("../handlers/stats.handler");

const router = Router();

// Get user dashboard summary
router.get(
  "/dashboard",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getDashboard)
);

// Get detailed visit records
router.get(
  "/links/:id/visits",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getVisitDetails)
);

// Get time-based heatmap
router.get(
  "/links/:id/heatmap",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getTimeHeatmap)
);

// Get UTM campaign statistics
router.get(
  "/links/:id/utm",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getUTMStats)
);

// Get real-time statistics
router.get(
  "/links/:id/realtime",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getRealTimeStats)
);

// Get device statistics
router.get(
  "/links/:id/devices",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getDeviceStats)
);

// Export statistics
router.get(
  "/links/:id/export",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.exportStats)
);

// Get conversion funnel (POST because it needs multiple link IDs)
router.post(
  "/funnel",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getConversionFunnel)
);

// Get A/B test statistics
router.post(
  "/abtest",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(stats.getABTestStats)
);

module.exports = router;
