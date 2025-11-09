async function createVisitDetailTable(knex) {
  const hasTable = await knex.schema.hasTable("visit_details");
  if (hasTable) return;

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
    
    table.string("ip_address", 45);
    table.string("country", 2);
    table.string("city", 100);
    table.string("region", 100);
    
    table.string("browser", 50);
    table.string("browser_version", 20);
    table.string("os", 50);
    table.string("os_version", 20);
    table.string("device_type", 20);
    table.string("device_brand", 50);
    table.string("device_model", 50);
    
    table.string("referrer", 500);
    table.string("referrer_domain", 255);
    
    table.string("utm_source", 255);
    table.string("utm_medium", 255);
    table.string("utm_campaign", 255);
    table.string("utm_term", 255);
    table.string("utm_content", 255);
    
    table.string("language", 10);
    table.string("screen_resolution", 20);
    table.boolean("is_bot").defaultTo(false);
    table.boolean("is_unique").defaultTo(false);
    
    table.timestamps(false, true);
    
    table.index("link_id");
    table.index("user_id");
    table.index("created_at");
    table.index(["link_id", "created_at"]);
    table.index("utm_campaign");
    table.index("country");
  });
}

module.exports = {
  createVisitDetailTable
};
