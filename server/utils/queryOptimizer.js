const knex = require("../knex");

/**
 * Query optimizer utilities for better database performance
 */

/**
 * Batch load records by IDs to avoid N+1 queries
 * @param {string} table - Table name
 * @param {Array} ids - Array of IDs to load
 * @param {string} column - Column name to match (default: 'id')
 * @returns {Promise<Map>} - Map of ID to record
 */
async function batchLoad(table, ids, column = 'id') {
  if (!ids || ids.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(ids)];
  
  const records = await knex(table)
    .whereIn(column, uniqueIds)
    .select('*');

  const map = new Map();
  records.forEach(record => {
    map.set(record[column], record);
  });

  return map;
}

/**
 * Create a simple in-memory cache for expensive queries
 */
class QueryCache {
  constructor(maxSize = 1000, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Execute query with caching
 */
async function cachedQuery(cache, key, queryFn) {
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  const result = await queryFn();
  cache.set(key, result);
  return result;
}

/**
 * Paginate query results efficiently
 */
function paginate(query, { page = 1, limit = 50 }) {
  const offset = (page - 1) * limit;
  return query.limit(limit).offset(offset);
}

/**
 * Add index hints for MySQL queries
 */
function withIndexHint(query, index, type = 'USE') {
  if (knex.isMySQL) {
    // MySQL supports index hints
    return query.from(knex.raw(`?? ${type} INDEX (??)`, [query._single.table, index]));
  }
  return query;
}

/**
 * Optimize COUNT queries by using approximate counts for large tables
 */
async function fastCount(table, where = {}) {
  if (knex.isPostgres) {
    // Use PostgreSQL statistics for approximate count
    const result = await knex.raw(
      `SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = ?`,
      [table]
    );
    if (result.rows && result.rows[0]) {
      return parseInt(result.rows[0].estimate, 10);
    }
  }

  // Fallback to exact count
  const result = await knex(table).where(where).count('* as count').first();
  return typeof result.count === 'number' ? result.count : parseInt(result.count, 10);
}

/**
 * Execute queries in parallel
 */
async function parallel(...queries) {
  return Promise.all(queries);
}

/**
 * Execute a query with a timeout
 */
async function withTimeout(query, timeoutMs = 30000) {
  return Promise.race([
    query,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ]);
}

/**
 * Batch insert with better performance
 */
async function batchInsert(table, data, chunkSize = 100) {
  if (!data || data.length === 0) {
    return [];
  }

  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const result = await knex.batchInsert(table, chunk, chunkSize);
    results.push(...result);
  }

  return results;
}

/**
 * Get query execution plan (for debugging)
 */
async function explain(query) {
  if (knex.isPostgres) {
    const sql = query.toSQL().sql;
    const result = await knex.raw(`EXPLAIN ANALYZE ${sql}`);
    return result.rows;
  } else if (knex.isMySQL) {
    const sql = query.toSQL().sql;
    const result = await knex.raw(`EXPLAIN ${sql}`);
    return result[0];
  }
  return null;
}

module.exports = {
  batchLoad,
  QueryCache,
  cachedQuery,
  paginate,
  withIndexHint,
  fastCount,
  parallel,
  withTimeout,
  batchInsert,
  explain,
};
