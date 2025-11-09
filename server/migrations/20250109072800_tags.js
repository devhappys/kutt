const env = require("../env");

const isMySQL = env.DB_CLIENT === "mysql" || env.DB_CLIENT === "mysql2";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  // Create tags table
  await knex.schema.createTable("tags", table => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("color", 20).defaultTo("#3b82f6"); // Default blue color
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamps(false, true);
    
    // Unique constraint: same user cannot have duplicate tag names
    table.unique(["user_id", "name"]);
  });

  // Create link_tags junction table for many-to-many relationship
  await knex.schema.createTable("link_tags", table => {
    table.increments("id").primary();
    table
      .integer("link_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("links")
      .onDelete("CASCADE");
    table
      .integer("tag_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("tags")
      .onDelete("CASCADE");
    table.timestamps(false, true);
    
    // Unique constraint: same link cannot have the same tag twice
    table.unique(["link_id", "tag_id"]);
  });

  // Create indexes for better query performance
  const ifNotExists = isMySQL ? "" : "IF NOT EXISTS";
  
  await Promise.all([
    knex.raw(`CREATE INDEX ${ifNotExists} tags_user_id_index ON tags (user_id);`),
    knex.raw(`CREATE INDEX ${ifNotExists} tags_name_index ON tags (name);`),
    knex.raw(`CREATE INDEX ${ifNotExists} link_tags_link_id_index ON link_tags (link_id);`),
    knex.raw(`CREATE INDEX ${ifNotExists} link_tags_tag_id_index ON link_tags (tag_id);`),
  ]);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  // Drop indexes first
  await Promise.all([
    knex.raw(`DROP INDEX IF EXISTS tags_user_id_index;`),
    knex.raw(`DROP INDEX IF EXISTS tags_name_index;`),
    knex.raw(`DROP INDEX IF EXISTS link_tags_link_id_index;`),
    knex.raw(`DROP INDEX IF EXISTS link_tags_tag_id_index;`),
  ]);

  // Drop tables
  await knex.schema.dropTableIfExists("link_tags");
  await knex.schema.dropTableIfExists("tags");
}

module.exports = {
  up,
  down,
};
