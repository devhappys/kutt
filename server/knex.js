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

// Helper function to handle case-insensitive LIKE queries without collation issues
db.ilike = function(query, column, value) {
  if (isPostgres) {
    return query.andWhereILike(column, value);
  } else if (isMySQL) {
    // Use LOWER() to avoid utf8_bin collation issues with utf8mb4
    return query.andWhereRaw(`LOWER(${column}) LIKE LOWER(?)`, [value]);
  } else {
    return query.andWhereILike(column, value);
  }
};

db.compatibleILIKE = "ilike"; // This will be used as a reference to our custom function

module.exports = db;
