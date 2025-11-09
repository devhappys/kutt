const { randomUUID } = require('node:crypto');

exports.up = async function(knex) {
  // Check if links table exists
  const hasTable = await knex.schema.hasTable('links');
  if (!hasTable) {
    return;
  }

  // Find all links with null or empty uuid
  const linksWithoutUuid = await knex('links')
    .whereNull('uuid')
    .orWhere('uuid', '');

  console.log(`Found ${linksWithoutUuid.length} links without UUID`);

  // Update each link with a new UUID
  for (const link of linksWithoutUuid) {
    const uuid = randomUUID();
    await knex('links')
      .where('id', link.id)
      .update({ uuid });
    console.log(`Updated link ${link.id} with UUID: ${uuid}`);
  }

  console.log('UUID migration completed');
};

exports.down = async function(knex) {
  // No need to rollback UUIDs
};
