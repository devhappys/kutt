/**
 * Performance monitoring and profiling utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Start timing an operation
   */
  start(label) {
    return {
      label,
      startTime: process.hrtime.bigint(),
      end: () => this.end(label),
    };
  }

  /**
   * End timing and record
   */
  end(label, startTime) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to ms

    if (!this.metrics.has(label)) {
      this.metrics.set(label, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      });
    }

    const metric = this.metrics.get(label);
    metric.count++;
    metric.total += duration;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);
    metric.avg = metric.total / metric.count;

    // Log slow operations
    if (duration > this.slowQueryThreshold) {
      console.warn(`[Performance] Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure async function execution time
   */
  async measure(label, fn) {
    const timer = this.start(label);
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  }

  /**
   * Get metrics for a specific label
   */
  getMetrics(label) {
    return this.metrics.get(label);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result = {};
    this.metrics.forEach((value, key) => {
      result[key] = {
        ...value,
        avg: parseFloat(value.avg.toFixed(2)),
        min: parseFloat(value.min.toFixed(2)),
        max: parseFloat(value.max.toFixed(2)),
        total: parseFloat(value.total.toFixed(2)),
      };
    });
    return result;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.clear();
  }

  /**
   * Get top slow operations
   */
  getSlowOperations(limit = 10) {
    const sorted = Array.from(this.metrics.entries())
      .sort((a, b) => b[1].avg - a[1].avg)
      .slice(0, limit);

    return sorted.map(([label, metric]) => ({
      label,
      avgTime: parseFloat(metric.avg.toFixed(2)),
      count: metric.count,
      maxTime: parseFloat(metric.max.toFixed(2)),
    }));
  }
}

// Global instance
const monitor = new PerformanceMonitor();

/**
 * Middleware to track request performance
 */
function performanceMiddleware(req, res, next) {
  const startTime = process.hrtime.bigint();
  const route = `${req.method} ${req.route?.path || req.path}`;

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    
    if (!monitor.metrics.has(route)) {
      monitor.metrics.set(route, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      });
    }

    const metric = monitor.metrics.get(route);
    metric.count++;
    metric.total += duration;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);
    metric.avg = metric.total / metric.count;

    // Log slow requests
    if (duration > 1000) {
      console.warn(`[Performance] Slow request: ${route} took ${duration.toFixed(2)}ms`);
    }
  });

  next();
}

/**
 * Create a simple request counter
 */
class RequestCounter {
  constructor() {
    this.requests = new Map();
    this.startTime = Date.now();
  }

  increment(route) {
    const count = this.requests.get(route) || 0;
    this.requests.set(route, count + 1);
  }

  getStats() {
    const uptime = Date.now() - this.startTime;
    const total = Array.from(this.requests.values()).reduce((sum, count) => sum + count, 0);

    return {
      uptime: Math.floor(uptime / 1000),
      totalRequests: total,
      requestsPerSecond: (total / (uptime / 1000)).toFixed(2),
      routes: Object.fromEntries(this.requests),
    };
  }

  reset() {
    this.requests.clear();
    this.startTime = Date.now();
  }
}

const requestCounter = new RequestCounter();

/**
 * Middleware to count requests
 */
function requestCounterMiddleware(req, res, next) {
  const route = `${req.method} ${req.route?.path || req.path}`;
  requestCounter.increment(route);
  next();
}

module.exports = {
  PerformanceMonitor,
  monitor,
  performanceMiddleware,
  RequestCounter,
  requestCounter,
  requestCounterMiddleware,
};
