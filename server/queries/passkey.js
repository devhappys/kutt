const knex = require("../knex");
const { now } = require("../utils/timezone");

/**
 * Create a new passkey
 */
const add = async (passkeyData) => {
  const [id] = await knex("passkeys").insert(passkeyData);
  return knex("passkeys").where({ id }).first();
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
const update = async (match, updateData) => {
  await knex("passkeys").where(match).update(updateData);
  return knex("passkeys").where(match).first();
};

/**
 * Update last used timestamp and counter
 */
const updateLastUsed = async (id, counter) => {
  return knex("passkeys")
    .where({ id })
    .update({
      counter,
      last_used: now()
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
