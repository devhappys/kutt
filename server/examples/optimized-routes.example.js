/**
 * Examples of how to use performance optimizations in routes
 * 
 * This file demonstrates best practices for applying
 * caching, deduplication, and performance monitoring
 */

const { Router } = require("express");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache.middleware");
const { deduplicationMiddleware } = require("../middleware/deduplication.middleware");
const { monitor } = require("../utils/performanceMonitor");
const { batchLoad, paginate, parallel } = require("../utils/queryOptimizer");
const asyncHandler = require("../utils/asyncHandler");
const knex = require("../knex");

const router = Router();

// ===== Example 1: Simple GET with caching =====
// Caches response for 5 minutes
router.get(
  "/stats/summary",
  cacheMiddleware({ ttl: 300, keyPrefix: 'stats:' }),
  asyncHandler(async (req, res) => {
    const stats = await knex('links')
      .count('* as totalLinks')
      .sum('visit_count as totalVisits')
      .first();

    res.json(stats);
  })
);

// ===== Example 2: Expensive operation with deduplication =====
// Prevents duplicate concurrent requests
router.get(
  "/reports/complex",
  deduplicationMiddleware({ onlyMethods: ['GET'] }),
  cacheMiddleware({ ttl: 600 }), // 10 minutes cache
  asyncHandler(async (req, res) => {
    // Simulate expensive operation
    const [links, domains, users] = await parallel(
      knex('links').count('* as count').first(),
      knex('domains').count('* as count').first(),
      knex('users').count('* as count').first()
    );

    res.json({ links, domains, users });
  })
);

// ===== Example 3: Paginated query with caching =====
router.get(
  "/links",
  cacheMiddleware({ 
    ttl: 60, // 1 minute cache
    skipCache: (req) => req.query.page > 10, // Don't cache deep pages
  }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    
    const query = knex('links')
      .leftJoin('users', 'links.user_id', 'users.id')
      .select('links.*', 'users.email');

    const results = await paginate(query, { page: parseInt(page), limit: parseInt(limit) });

    res.json({
      data: results,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  })
);

// ===== Example 4: Avoid N+1 with batch loading =====
router.get(
  "/links-with-users",
  cacheMiddleware({ ttl: 120 }),
  asyncHandler(async (req, res) => {
    // Get all links
    const links = await knex('links')
      .select('*')
      .limit(100);

    // Batch load users (avoids N+1 query)
    const userIds = links.map(link => link.user_id).filter(Boolean);
    const usersMap = await batchLoad('users', userIds, 'id');

    // Attach users to links
    const linksWithUsers = links.map(link => ({
      ...link,
      user: usersMap.get(link.user_id),
    }));

    res.json(linksWithUsers);
  })
);

// ===== Example 5: Manual performance monitoring =====
router.get(
  "/analytics/detailed",
  asyncHandler(async (req, res) => {
    // Measure specific operation
    const result = await monitor.measure('analytics-query', async () => {
      return await knex('visits')
        .select('country')
        .count('* as count')
        .groupBy('country')
        .orderBy('count', 'desc')
        .limit(10);
    });

    res.json(result);
  })
);

// ===== Example 6: Cache invalidation on write =====
router.post(
  "/links",
  asyncHandler(async (req, res) => {
    const { target, address } = req.body;

    // Create link
    const [id] = await knex('links').insert({
      target,
      address,
      user_id: req.user.id,
    });

    // Invalidate related caches
    await invalidateCache('api:cache:GET:/api/v2/links*');
    await invalidateCache('api:stats:*');

    const link = await knex('links').where({ id }).first();
    res.status(201).json(link);
  })
);

// ===== Example 7: Conditional caching based on user =====
router.get(
  "/user/profile",
  cacheMiddleware({
    ttl: 300,
    keyPrefix: 'profile:',
    skipCache: (req) => {
      // Don't cache for admin users
      return req.user?.role === 'admin';
    },
  }),
  asyncHandler(async (req, res) => {
    const user = await knex('users')
      .where({ id: req.user.id })
      .first();

    res.json(user);
  })
);

// ===== Example 8: Multiple cache layers =====
router.get(
  "/hot-links",
  // First layer: Deduplicate concurrent requests
  deduplicationMiddleware(),
  // Second layer: Cache response
  cacheMiddleware({ ttl: 180 }), // 3 minutes
  asyncHandler(async (req, res) => {
    const hotLinks = await knex('links')
      .select('*')
      .orderBy('visit_count', 'desc')
      .limit(20);

    res.json(hotLinks);
  })
);

// ===== Example 9: Performance-optimized aggregation =====
router.get(
  "/dashboard/stats",
  cacheMiddleware({ ttl: 300 }),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Run all queries in parallel
    const [linksCount, totalVisits, recentLinks, topLinks] = await parallel(
      // Total links count
      knex('links')
        .where({ user_id: userId })
        .count('* as count')
        .first()
        .then(r => r.count),

      // Total visits
      knex('links')
        .where({ user_id: userId })
        .sum('visit_count as total')
        .first()
        .then(r => r.total || 0),

      // Recent links
      knex('links')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .limit(5),

      // Top performing links
      knex('links')
        .where({ user_id: userId })
        .orderBy('visit_count', 'desc')
        .limit(5)
    );

    res.json({
      summary: {
        linksCount: parseInt(linksCount),
        totalVisits: parseInt(totalVisits),
      },
      recentLinks,
      topLinks,
    });
  })
);

// ===== Example 10: Streaming large datasets =====
// Note: Don't use caching for streaming responses
router.get(
  "/export/links",
  asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="links.json"');

    const stream = knex('links')
      .where({ user_id: req.user.id })
      .select('*')
      .stream();

    res.write('[');
    let first = true;

    for await (const link of stream) {
      if (!first) res.write(',');
      res.write(JSON.stringify(link));
      first = false;
    }

    res.write(']');
    res.end();
  })
);

module.exports = router;

/**
 * KEY TAKEAWAYS:
 * 
 * 1. Use caching for read-heavy endpoints (GET requests)
 * 2. Set appropriate TTL based on data freshness requirements
 * 3. Use deduplication for expensive operations
 * 4. Invalidate cache when data is modified
 * 5. Don't cache user-specific or sensitive data without careful consideration
 * 6. Use pagination for large datasets
 * 7. Batch load related data to avoid N+1 queries
 * 8. Run independent queries in parallel
 * 9. Monitor performance of critical endpoints
 * 10. Don't cache streaming responses
 * 
 * PERFORMANCE CHECKLIST:
 * - [ ] Add caching to read endpoints
 * - [ ] Add deduplication to expensive operations
 * - [ ] Use batch loading for N+1 scenarios
 * - [ ] Paginate large result sets
 * - [ ] Run queries in parallel when possible
 * - [ ] Invalidate cache on writes
 * - [ ] Monitor slow operations
 * - [ ] Set appropriate cache TTLs
 * - [ ] Test cache hit rates
 * - [ ] Profile query performance
 */
