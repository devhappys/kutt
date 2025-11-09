const redis = require("../redis");
const env = require("../env");

// Memory thresholds
const MEMORY_LIMIT_MB = 500;
const WARNING_THRESHOLD_MB = 400; // 80% of limit
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const CRITICAL_THRESHOLD_MB = 475; // 95% of limit

// Track memory warnings
let consecutiveWarnings = 0;
let lastGCTime = Date.now();

/**
 * Get current memory usage in MB
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // Resident Set Size
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
}

/**
 * Clear various caches to free up memory
 */
async function clearCaches() {
  console.log("[Memory Monitor] Clearing caches to free up memory...");
  
  let clearedCount = 0;
  
  // Clear Redis caches if enabled
  if (env.REDIS_ENABLED && redis.client) {
    try {
      // Get all keys and clear old cache entries
      const keys = await redis.client.keys("*");
      const now = Date.now();
      
      for (const key of keys) {
        const ttl = await redis.client.ttl(key);
        // Remove keys with TTL less than 5 minutes (likely stale)
        if (ttl > 0 && ttl < 300) {
          await redis.client.del(key);
          clearedCount++;
        }
      }
      
      console.log(`[Memory Monitor] Cleared ${clearedCount} Redis cache entries`);
    } catch (error) {
      console.error("[Memory Monitor] Error clearing Redis cache:", error.message);
    }
  }
  
  // Clear require cache for non-critical modules
  // Keep core modules but clear data/query result caches
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('/node_modules/') && !key.includes('express')) {
      // Don't clear Express or other critical modules
      return;
    }
    // Only clear non-essential cached modules
    if (key.includes('/queries/') || key.includes('/temp/')) {
      delete require.cache[key];
      clearedCount++;
    }
  });
  
  return clearedCount;
}

/**
 * Force garbage collection if available
 */
function forceGarbageCollection() {
  if (global.gc) {
    const before = getMemoryUsage();
    global.gc();
    const after = getMemoryUsage();
    const freed = before.heapUsed - after.heapUsed;
    
    console.log(`[Memory Monitor] Garbage collection freed ${freed}MB`);
    lastGCTime = Date.now();
    consecutiveWarnings = 0;
    
    return freed;
  } else {
    console.warn("[Memory Monitor] Garbage collection not available. Start Node.js with --expose-gc flag");
    return 0;
  }
}

/**
 * Handle memory pressure
 */
async function handleMemoryPressure(usage) {
  const memoryMB = usage.heapUsed;
  
  if (memoryMB >= CRITICAL_THRESHOLD_MB) {
    console.error(`[Memory Monitor] CRITICAL: Memory usage at ${memoryMB}MB (${Math.round(memoryMB/MEMORY_LIMIT_MB*100)}%)`);
    
    // Clear caches immediately
    await clearCaches();
    
    // Force GC if not done recently
    const timeSinceLastGC = Date.now() - lastGCTime;
    if (timeSinceLastGC > 10000) { // 10 seconds
      forceGarbageCollection();
    }
    
    consecutiveWarnings++;
    
    // If still high after 3 consecutive warnings, consider alerting
    if (consecutiveWarnings >= 3) {
      console.error(`[Memory Monitor] ALERT: Memory remains critically high after ${consecutiveWarnings} attempts to free memory`);
      console.error(`[Memory Monitor] Current usage: ${JSON.stringify(usage, null, 2)}`);
      
      // Reset counter to avoid spam
      consecutiveWarnings = 0;
    }
  } else if (memoryMB >= WARNING_THRESHOLD_MB) {
    console.warn(`[Memory Monitor] WARNING: Memory usage at ${memoryMB}MB (${Math.round(memoryMB/MEMORY_LIMIT_MB*100)}%)`);
    
    // Try gentle cleanup
    const timeSinceLastGC = Date.now() - lastGCTime;
    if (timeSinceLastGC > 60000) { // 1 minute
      forceGarbageCollection();
    }
    
    consecutiveWarnings++;
  } else {
    // Memory is healthy, reset counter
    if (consecutiveWarnings > 0) {
      console.log(`[Memory Monitor] Memory usage normalized at ${memoryMB}MB`);
    }
    consecutiveWarnings = 0;
  }
}

/**
 * Start memory monitoring
 */
function startMonitoring() {
  console.log(`[Memory Monitor] Starting memory monitoring (limit: ${MEMORY_LIMIT_MB}MB, check interval: ${CHECK_INTERVAL_MS/1000}s)`);
  
  // Initial check
  const initialUsage = getMemoryUsage();
  console.log(`[Memory Monitor] Initial memory usage: ${JSON.stringify(initialUsage, null, 2)}`);
  
  // Periodic monitoring
  setInterval(async () => {
    const usage = getMemoryUsage();
    
    // Only log if significant (to avoid spam)
    if (usage.heapUsed >= WARNING_THRESHOLD_MB * 0.8) { // 80% of warning threshold
      console.log(`[Memory Monitor] Memory check: ${usage.heapUsed}MB heap / ${usage.rss}MB RSS`);
    }
    
    await handleMemoryPressure(usage);
  }, CHECK_INTERVAL_MS);
  
  // Log memory stats every 5 minutes
  setInterval(() => {
    const usage = getMemoryUsage();
    console.log(`[Memory Monitor] Periodic report: Heap ${usage.heapUsed}/${usage.heapTotal}MB, RSS ${usage.rss}MB, External ${usage.external}MB`);
  }, 300000); // 5 minutes
}

/**
 * Get memory stats for API/monitoring
 */
function getMemoryStats() {
  const usage = getMemoryUsage();
  const percentage = Math.round((usage.heapUsed / MEMORY_LIMIT_MB) * 100);
  
  return {
    current: usage,
    limit: MEMORY_LIMIT_MB,
    percentage,
    status: 
      usage.heapUsed >= CRITICAL_THRESHOLD_MB ? 'critical' :
      usage.heapUsed >= WARNING_THRESHOLD_MB ? 'warning' : 'healthy',
    thresholds: {
      warning: WARNING_THRESHOLD_MB,
      critical: CRITICAL_THRESHOLD_MB,
      limit: MEMORY_LIMIT_MB,
    },
  };
}

module.exports = {
  startMonitoring,
  getMemoryStats,
  getMemoryUsage,
  clearCaches,
  forceGarbageCollection,
};
