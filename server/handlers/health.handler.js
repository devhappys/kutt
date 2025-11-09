const memoryMonitor = require("../utils/memoryMonitor");
const { monitor: perfMonitor, requestCounter } = require("../utils/performanceMonitor");

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  const memoryStats = memoryMonitor.getMemoryStats();
  const uptime = Math.floor(process.uptime());
  
  const health = {
    status: 'ok',
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    memory: memoryStats,
    timestamp: new Date().toISOString(),
  };
  
  // Return 503 if memory is critical
  if (memoryStats.status === 'critical') {
    health.status = 'degraded';
    return res.status(503).json(health);
  }
  
  return res.status(200).json(health);
}

/**
 * Memory stats endpoint (admin only)
 */
async function memoryStats(req, res) {
  const stats = memoryMonitor.getMemoryStats();
  const detailed = {
    ...stats,
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      cpuUsage: process.cpuUsage(),
    },
  };
  
  return res.status(200).json(detailed);
}

/**
 * Performance stats endpoint (admin only)
 */
async function performanceStats(req, res) {
  const perfMetrics = perfMonitor.getAllMetrics();
  const slowOps = perfMonitor.getSlowOperations(20);
  const reqStats = requestCounter.getStats();

  return res.status(200).json({
    performance: perfMetrics,
    slowOperations: slowOps,
    requests: reqStats,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger manual garbage collection (admin only)
 */
async function triggerGC(req, res) {
  const before = memoryMonitor.getMemoryUsage();
  const freed = memoryMonitor.forceGarbageCollection();
  const after = memoryMonitor.getMemoryUsage();
  
  return res.status(200).json({
    message: 'Garbage collection triggered',
    freed: `${freed}MB`,
    before,
    after,
  });
}

/**
 * Clear caches manually (admin only)
 */
async function clearCaches(req, res) {
  const before = memoryMonitor.getMemoryUsage();
  const clearedCount = await memoryMonitor.clearCaches();
  const after = memoryMonitor.getMemoryUsage();
  
  return res.status(200).json({
    message: 'Caches cleared',
    clearedItems: clearedCount,
    memoryFreed: `${before.heapUsed - after.heapUsed}MB`,
    before,
    after,
  });
}

module.exports = {
  healthCheck,
  memoryStats,
  performanceStats,
  triggerGC,
  clearCaches,
};
