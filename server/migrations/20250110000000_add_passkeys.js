exports.up = async function(knex) {
  // Create passkeys table for WebAuthn credentials
  const hasTable = await knex.schema.hasTable("passkeys");
  if (!hasTable) {
    await knex.schema.createTable("passkeys", table => {
      table.string("id", 255).primary();
      table.integer("user_id").unsigned().notNullable();
      table.string("name", 255).notNullable(); // User-friendly name for the passkey
      table.string("credential_id", 1024).notNullable(); // Base64URL encoded credential ID (changed from text to varchar)
      table.text("credential_public_key").notNullable(); // Base64URL encoded public key
      table.integer("counter").unsigned().notNullable().defaultTo(0); // Signature counter
      table.string("transports", 255); // Comma-separated list of transports
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("last_used").nullable();
      
      // Foreign key
      table.foreign("user_id").references("users.id").onDelete("CASCADE");
      
      // Index for faster lookups
      table.index("user_id");
      table.index("credential_id"); // Removed BTREE specification for MySQL compatibility
    });
  }
  
  // Add passkey_enabled flag to users table
  const hasUsersTable = await knex.schema.hasTable("users");
  if (hasUsersTable) {
    const hasPasskeyEnabled = await knex.schema.hasColumn("users", "passkey_enabled");
    if (!hasPasskeyEnabled) {
      await knex.schema.table("users", table => {
        table.boolean("passkey_enabled").notNullable().defaultTo(false);
      });
    }
    
    // Add passkey_2fa_required flag to control if passkey is required as 2FA
    const hasPasskey2FARequired = await knex.schema.hasColumn("users", "passkey_2fa_required");
    if (!hasPasskey2FARequired) {
      await knex.schema.table("users", table => {
        table.boolean("passkey_2fa_required").notNullable().defaultTo(true);
      });
    }
  }
};

exports.down = async function(knex) {
  // Remove passkey fields from users table
  const hasUsersTable = await knex.schema.hasTable("users");
  if (hasUsersTable) {
    const hasPasskey2FARequired = await knex.schema.hasColumn("users", "passkey_2fa_required");
    if (hasPasskey2FARequired) {
      await knex.schema.table("users", table => {
        table.dropColumn("passkey_2fa_required");
      });
    }
    
    const hasPasskeyEnabled = await knex.schema.hasColumn("users", "passkey_enabled");
    if (hasPasskeyEnabled) {
      await knex.schema.table("users", table => {
        table.dropColumn("passkey_enabled");
      });
    }
  }
  
  // Drop passkeys table
  const hasTable = await knex.schema.hasTable("passkeys");
  if (hasTable) {
    await knex.schema.dropTable("passkeys");
  }
};
