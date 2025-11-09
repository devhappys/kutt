/**
 * Request deduplication middleware
 * Prevents duplicate requests from being processed simultaneously
 * Useful for expensive operations like stats generation
 */

const crypto = require('node:crypto');

class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Generate unique key for request
   */
  generateKey(req) {
    const { method, path, user } = req;
    const userId = user?.id || 'anonymous';
    const query = JSON.stringify(req.query);
    const body = method !== 'GET' ? JSON.stringify(req.body) : '';
    
    const data = `${method}:${path}:${userId}:${query}:${body}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if request is duplicate and wait for original
   */
  async deduplicate(req) {
    const key = this.generateKey(req);
    
    // If request is already pending, wait for it
    if (this.pending.has(key)) {
      const { promise } = this.pending.get(key);
      return { isDuplicate: true, promise };
    }

    // Create new promise for this request
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const timeoutId = setTimeout(() => {
      this.pending.delete(key);
      reject(new Error('Request deduplication timeout'));
    }, this.timeout);

    this.pending.set(key, { promise, resolve, reject, timeoutId });

    return { isDuplicate: false, key };
  }

  /**
   * Complete request and notify waiting duplicates
   */
  complete(key, result) {
    const entry = this.pending.get(key);
    if (entry) {
      clearTimeout(entry.timeoutId);
      entry.resolve(result);
      this.pending.delete(key);
    }
  }

  /**
   * Fail request and notify waiting duplicates
   */
  fail(key, error) {
    const entry = this.pending.get(key);
    if (entry) {
      clearTimeout(entry.timeoutId);
      entry.reject(error);
      this.pending.delete(key);
    }
  }

  /**
   * Get number of pending requests
   */
  getPendingCount() {
    return this.pending.size;
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pending.forEach(({ timeoutId, reject }) => {
      clearTimeout(timeoutId);
      reject(new Error('Deduplicator cleared'));
    });
    this.pending.clear();
  }
}

const deduplicator = new RequestDeduplicator();

/**
 * Middleware factory for request deduplication
 */
function deduplicationMiddleware(options = {}) {
  const {
    skipRoutes = [],
    onlyMethods = ['GET'],
  } = options;

  return async function(req, res, next) {
    // Skip if method not in onlyMethods
    if (!onlyMethods.includes(req.method)) {
      return next();
    }

    // Skip if route is in skipRoutes
    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    try {
      const { isDuplicate, promise, key } = await deduplicator.deduplicate(req);

      if (isDuplicate) {
        // Wait for original request to complete
        const result = await promise;
        res.setHeader('X-Dedup', 'HIT');
        return res.status(result.status).json(result.data);
      }

      // Mark this as original request
      res.setHeader('X-Dedup', 'MISS');

      // Intercept response to cache result
      const originalJson = res.json;
      res.json = function(data) {
        deduplicator.complete(key, {
          status: res.statusCode,
          data: data,
        });
        return originalJson.call(this, data);
      };

      // Handle errors
      res.on('error', (err) => {
        deduplicator.fail(key, err);
      });

      next();
    } catch (error) {
      console.error('Deduplication error:', error);
      next();
    }
  };
}

module.exports = {
  deduplicationMiddleware,
  deduplicator,
  RequestDeduplicator,
};
