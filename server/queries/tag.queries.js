const knex = require("../knex");
const utils = require("../utils");

const CustomError = utils.CustomError;

// Get all tags for a user
async function getByUserId(userId) {
  return knex("tags")
    .where("user_id", userId)
    .orderBy("name", "asc");
}

// Get a single tag by id and user
async function getById(id, userId) {
  const tag = await knex("tags")
    .where({ id, user_id: userId })
    .first();
  
  if (!tag) {
    throw new CustomError("Tag not found.", 404);
  }
  
  return tag;
}

// Create a new tag
async function create(data) {
  const { name, color, user_id } = data;
  
  // Check if tag with same name exists for this user
  const existing = await knex("tags")
    .where({ name, user_id })
    .first();
  
  if (existing) {
    throw new CustomError("A tag with this name already exists.", 400);
  }
  
  const [id] = await knex("tags").insert({
    name,
    color: color || "#3b82f6",
    user_id,
  });
  
  return knex("tags").where({ id }).first();
}

// Update a tag
async function update(id, userId, data) {
  const tag = await getById(id, userId);
  
  const { name, color } = data;
  
  // If name is being changed, check for duplicates
  if (name && name !== tag.name) {
    const existing = await knex("tags")
      .where({ name, user_id: userId })
      .whereNot({ id })
      .first();
    
    if (existing) {
      throw new CustomError("A tag with this name already exists.", 400);
    }
  }
  
  await knex("tags")
    .where({ id, user_id: userId })
    .update({
      ...(name && { name }),
      ...(color && { color }),
      updated_at: knex.fn.now(),
    });
  
  return knex("tags").where({ id }).first();
}

// Delete a tag
async function remove(id, userId) {
  const tag = await getById(id, userId);
  
  await knex("tags")
    .where({ id, user_id: userId })
    .delete();
  
  return tag;
}

// Get tags for a specific link
async function getByLinkId(linkId) {
  return knex("tags")
    .join("link_tags", "tags.id", "link_tags.tag_id")
    .where("link_tags.link_id", linkId)
    .select("tags.*")
    .orderBy("tags.name", "asc");
}

// Add tags to a link
async function addToLink(linkId, tagIds) {
  if (!tagIds || tagIds.length === 0) return [];
  
  // Remove duplicates
  const uniqueTagIds = [...new Set(tagIds)];
  
  // Get existing associations
  const existing = await knex("link_tags")
    .where("link_id", linkId)
    .whereIn("tag_id", uniqueTagIds)
    .pluck("tag_id");
  
  // Filter out already associated tags
  const newTagIds = uniqueTagIds.filter(id => !existing.includes(id));
  
  if (newTagIds.length > 0) {
    const insertData = newTagIds.map(tagId => ({
      link_id: linkId,
      tag_id: tagId,
    }));
    
    await knex("link_tags").insert(insertData);
  }
  
  return getByLinkId(linkId);
}

// Remove tags from a link
async function removeFromLink(linkId, tagIds) {
  if (!tagIds || tagIds.length === 0) return;
  
  await knex("link_tags")
    .where("link_id", linkId)
    .whereIn("tag_id", tagIds)
    .delete();
  
  return getByLinkId(linkId);
}

// Remove all tags from a link
async function removeAllFromLink(linkId) {
  await knex("link_tags")
    .where("link_id", linkId)
    .delete();
}

// Get links by tag
async function getLinksByTag(tagId, userId) {
  return knex("links")
    .join("link_tags", "links.id", "link_tags.link_id")
    .where("link_tags.tag_id", tagId)
    .where("links.user_id", userId)
    .select("links.*")
    .orderBy("links.created_at", "desc");
}

// Get tag usage count
async function getUsageCount(tagId) {
  const result = await knex("link_tags")
    .where("tag_id", tagId)
    .count("* as count")
    .first();
  
  return parseInt(result.count, 10);
}

module.exports = {
  getByUserId,
  getById,
  create,
  update,
  remove,
  getByLinkId,
  addToLink,
  removeFromLink,
  removeAllFromLink,
  getLinksByTag,
  getUsageCount,
};
