const redis = require("../redis");
const crypto = require("node:crypto");

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
  const { method, originalUrl, user } = req;
  const userId = user?.id || 'anonymous';
  const key = `cache:${method}:${originalUrl}:${userId}`;
  return key;
}

/**
 * Redis-based response caching middleware
 * Only caches GET requests with 200 status
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'api:',
    skipCache = () => false,
  } = options;

  return async function(req, res, next) {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis is not enabled
    if (!redis.client) {
      return next();
    }

    // Skip if custom condition matches
    if (skipCache(req)) {
      return next();
    }

    const cacheKey = keyPrefix + generateCacheKey(req);

    try {
      // Try to get cached response
      const cached = await redis.client.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', crypto.createHash('md5').update(cacheKey).digest('hex').substring(0, 8));
        return res.status(data.status).json(data.body);
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');
      
      const originalSend = res.json;
      res.json = function(body) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          const cacheData = {
            status: res.statusCode,
            body: body,
            timestamp: Date.now(),
          };
          
          // Store in cache asynchronously (don't wait)
          redis.client.setex(cacheKey, ttl, JSON.stringify(cacheData))
            .catch(err => console.error('Cache write error:', err));
        }
        
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 */
async function invalidateCache(pattern) {
  if (!redis.client) return;
  
  try {
    const keys = await redis.client.keys(pattern);
    if (keys.length > 0) {
      await redis.client.del(...keys);
      console.log(`[Cache] Invalidated ${keys.length} cache entries matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Clear all API cache
 */
async function clearAllCache() {
  if (!redis.client) return;
  
  try {
    await redis.client.eval(
      "return redis.call('del', unpack(redis.call('keys', ARGV[1])))",
      0,
      'api:*'
    );
    console.log('[Cache] Cleared all API cache');
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
  generateCacheKey,
};
