const env = require("../env");

const isMySQL = env.DB_CLIENT === "mysql" || env.DB_CLIENT === "mysql2";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  // Create IP blacklist/whitelist table
  await knex.schema.createTable("ip_rules", table => {
    table.increments("id").primary();
    table
      .integer("link_id")
      .unsigned()
      .references("id")
      .inTable("links")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    
    table.string("ip_address", 45).notNullable(); // Supports IPv6
    table.string("ip_range", 50); // CIDR notation for ranges
    table.enum("rule_type", ["blacklist", "whitelist"]).notNullable();
    table.text("reason");
    table.boolean("is_active").defaultTo(true);
    
    table.timestamps(false, true);
    
    table.index("ip_address");
    table.index("link_id");
    table.index("user_id");
    table.index(["rule_type", "is_active"]);
  });

  // Create geo-restriction table
  await knex.schema.createTable("geo_restrictions", table => {
    table.increments("id").primary();
    table
      .integer("link_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("links")
      .onDelete("CASCADE");
    
    table.string("country_code", 2); // ISO 3166-1 alpha-2
    table.string("region", 100);
    table.string("city", 100);
    table.enum("restriction_type", ["allow", "block"]).notNullable();
    table.string("redirect_url", 2040); // Alternative redirect for blocked regions
    
    table.timestamps(false, true);
    
    table.index("link_id");
    table.index("country_code");
  });

  // Create smart redirect rules table
  await knex.schema.createTable("redirect_rules", table => {
    table.increments("id").primary();
    table
      .integer("link_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("links")
      .onDelete("CASCADE");
    
    table.string("rule_name", 100).notNullable();
    table.integer("priority").defaultTo(0); // Higher priority rules are evaluated first
    table.boolean("is_active").defaultTo(true);
    
    // Condition types
    table.enum("condition_type", [
      "device", 
      "browser", 
      "os", 
      "country", 
      "language", 
      "time", 
      "referrer",
      "custom"
    ]).notNullable();
    
    // Condition values (JSON)
    table.jsonb("condition_value"); // e.g., {"device": "mobile"} or {"country": ["us", "uk"]}
    
    // Target URL for this condition
    table.string("target_url", 2040).notNullable();
    
    // Optional: Time-based conditions
    table.time("time_start");
    table.time("time_end");
    table.string("days_of_week", 20); // e.g., "1,2,3,4,5" for weekdays
    
    table.timestamps(false, true);
    
    table.index("link_id");
    table.index(["condition_type", "is_active"]);
    table.index("priority");
  });

  // Create rate limit rules table
  await knex.schema.createTable("rate_limit_rules", table => {
    table.increments("id").primary();
    table
      .integer("link_id")
      .unsigned()
      .references("id")
      .inTable("links")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    
    table.integer("max_requests").notNullable(); // Maximum requests allowed
    table.integer("window_seconds").notNullable(); // Time window in seconds
    table.enum("action", ["block", "throttle", "captcha"]).defaultTo("block");
    table.string("block_duration_minutes", 10).defaultTo("60");
    table.boolean("is_active").defaultTo(true);
    
    table.timestamps(false, true);
    
    table.index("link_id");
    table.index("user_id");
  });

  // Create rate limit violations tracking table
  await knex.schema.createTable("rate_limit_violations", table => {
    table.bigIncrements("id").primary();
    table
      .integer("rule_id")
      .unsigned()
      .references("id")
      .inTable("rate_limit_rules")
      .onDelete("CASCADE");
    table
      .integer("link_id")
      .unsigned()
      .references("id")
      .inTable("links")
      .onDelete("CASCADE");
    
    table.string("ip_address", 45).notNullable();
    table.integer("request_count").notNullable();
    table.dateTime("blocked_until");
    table.text("user_agent");
    
    table.timestamps(false, true);
    
    table.index("ip_address");
    table.index("link_id");
    table.index("blocked_until");
  });

  // Add security and smart redirect columns to links table
  await knex.schema.alterTable("links", table => {
    table.boolean("ip_restriction_enabled").defaultTo(false);
    table.boolean("geo_restriction_enabled").defaultTo(false);
    table.boolean("smart_redirect_enabled").defaultTo(false);
    table.boolean("rate_limit_enabled").defaultTo(false);
    table.integer("default_rate_limit").defaultTo(100); // requests per minute
    table.text("security_notes");
  });

  // Create indexes
  const ifNotExists = isMySQL ? "" : "IF NOT EXISTS";
  
  await Promise.all([
    knex.raw(`CREATE INDEX ${ifNotExists} ip_rules_active_index ON ip_rules (is_active);`),
    knex.raw(`CREATE INDEX ${ifNotExists} redirect_rules_active_index ON redirect_rules (is_active);`),
  ]);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  // Drop indexes
  await Promise.all([
    knex.raw(`DROP INDEX IF EXISTS ip_rules_active_index;`),
    knex.raw(`DROP INDEX IF EXISTS redirect_rules_active_index;`),
  ]);

  // Remove columns from links table
  await knex.schema.alterTable("links", table => {
    table.dropColumn("ip_restriction_enabled");
    table.dropColumn("geo_restriction_enabled");
    table.dropColumn("smart_redirect_enabled");
    table.dropColumn("rate_limit_enabled");
    table.dropColumn("default_rate_limit");
    table.dropColumn("security_notes");
  });

  // Drop tables
  await knex.schema.dropTableIfExists("rate_limit_violations");
  await knex.schema.dropTableIfExists("rate_limit_rules");
  await knex.schema.dropTableIfExists("redirect_rules");
  await knex.schema.dropTableIfExists("geo_restrictions");
  await knex.schema.dropTableIfExists("ip_rules");
}

module.exports = {
  up,
  down,
};
