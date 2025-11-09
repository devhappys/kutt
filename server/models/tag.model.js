async function createTagTable(knex) {
  const hasTable = await knex.schema.hasTable("tags");
  if (hasTable) return;

  await knex.schema.createTable("tags", table => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("color", 20).defaultTo("#3b82f6");
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamps(false, true);
    table.unique(["user_id", "name"]);
  });
}

async function createLinkTagsTable(knex) {
  const hasTable = await knex.schema.hasTable("link_tags");
  if (hasTable) return;

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
    table.unique(["link_id", "tag_id"]);
  });
}

module.exports = {
  createTagTable,
  createLinkTagsTable
};
