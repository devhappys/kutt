const knex = require("../knex");

/**
 * Create a new passkey
 */
const add = async (passkeyData) => {
  const [passkey] = await knex("passkeys")
    .insert(passkeyData)
    .returning("*");
  return passkey;
};

/**
 * Find passkey by ID
 */
const find = async (match) => {
  return knex("passkeys")
    .where(match)
    .first();
};

/**
 * Get all passkeys for a user
 */
const getByUserId = async (userId) => {
  return knex("passkeys")
    .where({ user_id: userId })
    .orderBy("created_at", "desc");
};

/**
 * Find passkey by credential ID
 */
const findByCredentialId = async (credentialId) => {
  return knex("passkeys")
    .where({ credential_id: credentialId })
    .first();
};

/**
 * Update passkey
 */
const update = async (match, update) => {
  const [passkey] = await knex("passkeys")
    .where(match)
    .update({
      ...update,
      updated_at: new Date().toISOString()
    })
    .returning("*");
  return passkey;
};

/**
 * Update last used timestamp and counter
 */
const updateLastUsed = async (id, counter) => {
  return knex("passkeys")
    .where({ id })
    .update({
      counter,
      last_used: new Date().toISOString()
    });
};

/**
 * Delete passkey
 */
const remove = async (match) => {
  const passkey = await find(match);
  if (!passkey) {
    return { error: "Passkey not found." };
  }
  
  await knex("passkeys")
    .where(match)
    .delete();
    
  return { passkey };
};

/**
 * Count passkeys for a user
 */
const countByUserId = async (userId) => {
  const result = await knex("passkeys")
    .where({ user_id: userId })
    .count("* as count")
    .first();
  return parseInt(result.count);
};

module.exports = {
  add,
  find,
  getByUserId,
  findByCredentialId,
  update,
  updateLastUsed,
  remove,
  countByUserId
};
