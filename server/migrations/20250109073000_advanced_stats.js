const env = require("../env");

const isMySQL = env.DB_CLIENT === "mysql" || env.DB_CLIENT === "mysql2";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  // Create visit_details table for storing individual visit records
  await knex.schema.createTable("visit_details", table => {
    table.bigIncrements("id").primary();
    table
      .integer("link_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("links")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    
    // Visit metadata
    table.string("ip_address", 45); // Supports IPv6
    table.string("country", 2); // ISO 3166-1 alpha-2
    table.string("city", 100);
    table.string("region", 100);
    
    // Device information
    table.string("browser", 50);
    table.string("browser_version", 20);
    table.string("os", 50);
    table.string("os_version", 20);
    table.string("device_type", 20); // desktop, mobile, tablet
    table.string("device_brand", 50);
    table.string("device_model", 50);
    
    // Referrer information
    table.string("referrer", 500);
    table.string("referrer_domain", 255);
    
    // UTM parameters
    table.string("utm_source", 255);
    table.string("utm_medium", 255);
    table.string("utm_campaign", 255);
    table.string("utm_term", 255);
    table.string("utm_content", 255);
    
    // Additional tracking
    table.string("language", 10);
    table.string("screen_resolution", 20);
    table.boolean("is_bot").defaultTo(false);
    table.boolean("is_unique").defaultTo(false); // First visit from this IP to this link
    
    table.timestamps(false, true);
    
    // Indexes for performance
    table.index("link_id");
    table.index("user_id");
    table.index("created_at");
    table.index(["link_id", "created_at"]);
    table.index("utm_campaign");
    table.index("country");
  });

  // Add UTM tracking columns to links table
  const hasUtmTracking = await knex.schema.hasColumn("links", "utm_tracking_enabled");
  if (!hasUtmTracking) {
    await knex.schema.alterTable("links", table => {
      table.boolean("utm_tracking_enabled").defaultTo(true);
    });
  }

  // Create indexes on existing visits table
  const ifNotExists = isMySQL ? "" : "IF NOT EXISTS";
  
  await Promise.all([
    knex.raw(`CREATE INDEX ${ifNotExists} visits_created_at_index ON visits (created_at);`),
    knex.raw(`CREATE INDEX ${ifNotExists} visits_link_user_index ON visits (link_id, user_id);`),
  ]);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  // Drop indexes
  await Promise.all([
    knex.raw(`DROP INDEX IF EXISTS visits_created_at_index;`),
    knex.raw(`DROP INDEX IF EXISTS visits_link_user_index;`),
  ]);

  // Drop column from links table
  await knex.schema.alterTable("links", table => {
    table.dropColumn("utm_tracking_enabled");
  });

  // Drop visit_details table
  await knex.schema.dropTableIfExists("visit_details");
}

module.exports = {
  up,
  down,
};
