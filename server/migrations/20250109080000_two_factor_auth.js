exports.up = async function(knex) {
  // Add 2FA fields to users table
  const hasTable = await knex.schema.hasTable("users");
  if (hasTable) {
    const hasTwoFASecret = await knex.schema.hasColumn("users", "twofa_secret");
    if (!hasTwoFASecret) {
      await knex.schema.table("users", table => {
        table.string("twofa_secret");
        table.boolean("twofa_enabled").notNullable().defaultTo(false);
        table.text("twofa_backup_codes");
      });
    }
  }
};

exports.down = async function(knex) {
  // Remove 2FA fields from users table
  const hasTable = await knex.schema.hasTable("users");
  if (hasTable) {
    const hasTwoFASecret = await knex.schema.hasColumn("users", "twofa_secret");
    if (hasTwoFASecret) {
      await knex.schema.table("users", table => {
        table.dropColumn("twofa_secret");
        table.dropColumn("twofa_enabled");
        table.dropColumn("twofa_backup_codes");
      });
    }
  }
};
