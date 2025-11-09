async function createSecurityTables(knex) {
  // Create IP rules table
  const hasIPRules = await knex.schema.hasTable("ip_rules");
  if (!hasIPRules) {
    await knex.schema.createTable("ip_rules", table => {
      table.increments("id").primary();
      table.integer("link_id").unsigned().references("id").inTable("links").onDelete("CASCADE");
      table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      table.string("ip_address", 45).notNullable();
      table.string("ip_range", 50);
      table.enum("rule_type", ["blacklist", "whitelist"]).notNullable();
      table.text("reason");
      table.boolean("is_active").defaultTo(true);
      table.timestamps(false, true);
      table.index("ip_address");
      table.index("link_id");
      table.index("user_id");
    });
  }

  // Create geo restrictions table
  const hasGeoRestrictions = await knex.schema.hasTable("geo_restrictions");
  if (!hasGeoRestrictions) {
    await knex.schema.createTable("geo_restrictions", table => {
      table.increments("id").primary();
      table.integer("link_id").unsigned().notNullable().references("id").inTable("links").onDelete("CASCADE");
      table.string("country_code", 2);
      table.string("region", 100);
      table.string("city", 100);
      table.enum("restriction_type", ["allow", "block"]).notNullable();
      table.string("redirect_url", 2040);
      table.timestamps(false, true);
      table.index("link_id");
      table.index("country_code");
    });
  }

  // Create rate limit rules table
  const hasRateLimitRules = await knex.schema.hasTable("rate_limit_rules");
  if (!hasRateLimitRules) {
    await knex.schema.createTable("rate_limit_rules", table => {
      table.increments("id").primary();
      table.integer("link_id").unsigned().references("id").inTable("links").onDelete("CASCADE");
      table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      table.integer("max_requests").notNullable();
      table.integer("window_seconds").notNullable();
      table.enum("action", ["block", "throttle", "captcha"]).defaultTo("block");
      table.string("block_duration_minutes", 10).defaultTo("60");
      table.boolean("is_active").defaultTo(true);
      table.timestamps(false, true);
      table.index("link_id");
      table.index("user_id");
    });
  }

  // Create rate limit violations table
  const hasRateLimitViolations = await knex.schema.hasTable("rate_limit_violations");
  if (!hasRateLimitViolations) {
    await knex.schema.createTable("rate_limit_violations", table => {
      table.bigIncrements("id").primary();
      table.integer("rule_id").unsigned().references("id").inTable("rate_limit_rules").onDelete("CASCADE");
      table.integer("link_id").unsigned().references("id").inTable("links").onDelete("CASCADE");
      table.string("ip_address", 45).notNullable();
      table.integer("request_count").notNullable();
      table.dateTime("blocked_until");
      table.text("user_agent");
      table.timestamps(false, true);
      table.index("ip_address");
      table.index("link_id");
      table.index("blocked_until");
    });
  }
}

async function createRedirectRulesTable(knex) {
  const hasTable = await knex.schema.hasTable("redirect_rules");
  if (hasTable) return;

  await knex.schema.createTable("redirect_rules", table => {
    table.increments("id").primary();
    table.integer("link_id").unsigned().notNullable().references("id").inTable("links").onDelete("CASCADE");
    table.string("rule_name", 100).notNullable();
    table.integer("priority").defaultTo(0);
    table.boolean("is_active").defaultTo(true);
    table.enum("condition_type", ["device", "browser", "os", "country", "language", "time", "referrer", "custom"]).notNullable();
    table.jsonb("condition_value");
    table.string("target_url", 2040).notNullable();
    table.time("time_start");
    table.time("time_end");
    table.string("days_of_week", 20);
    table.timestamps(false, true);
    table.index("link_id");
    table.index(["condition_type", "is_active"]);
    table.index("priority");
  });
}

module.exports = {
  createSecurityTables,
  createRedirectRulesTable
};
