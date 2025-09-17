const knex = require("knex");

const env = require("./env");

const isSQLite = env.DB_CLIENT === "sqlite3" || env.DB_CLIENT === "better-sqlite3";
const isPostgres = env.DB_CLIENT === "pg" || env.DB_CLIENT === "pg-native";
const isMySQL = env.DB_CLIENT === "mysql" || env.DB_CLIENT === "mysql2";

const db = knex({
  client: env.DB_CLIENT,
  connection: {
    ...(isSQLite && { filename: env.DB_FILENAME }),
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    ...(isMySQL && {
      charset: 'utf8mb4'
    }),
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX
    }
  },
  useNullAsDefault: true,
});

db.isPostgres = isPostgres;
db.isSQLite = isSQLite;
db.isMySQL = isMySQL;

// Custom ILIKE helper to avoid collation issues with MySQL utf8mb4
db.compatibleILIKE = function (column, value) {
  if (isPostgres) {
    return "andWhereILike";
  } else if (isMySQL) {
    // Use a custom method name that we'll handle in queries
    return "andWhereRaw";
  } else {
    return "andWhereILike";
  }
}();

// Helper function for MySQL case-insensitive LIKE without collation issues
db.mysqlILike = function (query, column, value) {
  return query.andWhereRaw(`LOWER(${column}) LIKE LOWER(?)`, [value]);
};

module.exports = db;
