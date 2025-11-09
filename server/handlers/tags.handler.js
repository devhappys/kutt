const query = require("../queries");
const utils = require("../utils");

const CustomError = utils.CustomError;

// Get all tags for current user
async function get(req, res) {
  const userId = req.user.id;
  const tags = await query.tag.getByUserId(userId);
  
  // Add usage count to each tag
  const tagsWithCount = await Promise.all(
    tags.map(async tag => ({
      ...tag,
      usage_count: await query.tag.getUsageCount(tag.id),
    }))
  );
  
  return res.send({
    data: tagsWithCount,
  });
}

// Get a single tag
async function getOne(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const tag = await query.tag.getById(id, userId);
  const usageCount = await query.tag.getUsageCount(id);
  
  return res.send({
    ...tag,
    usage_count: usageCount,
  });
}

// Create a new tag
async function create(req, res) {
  const { name, color } = req.body;
  const userId = req.user.id;
  
  if (!name || name.trim().length === 0) {
    throw new CustomError("Tag name is required.", 400);
  }
  
  if (name.length > 100) {
    throw new CustomError("Tag name must be 100 characters or less.", 400);
  }
  
  const tag = await query.tag.create({
    name: name.trim(),
    color: color || "#3b82f6",
    user_id: userId,
  });
  
  return res.status(201).send({
    ...tag,
    usage_count: 0,
  });
}

// Update a tag
async function update(req, res) {
  const { id } = req.params;
  const { name, color } = req.body;
  const userId = req.user.id;
  
  if (name !== undefined) {
    if (name.trim().length === 0) {
      throw new CustomError("Tag name cannot be empty.", 400);
    }
    if (name.length > 100) {
      throw new CustomError("Tag name must be 100 characters or less.", 400);
    }
  }
  
  const tag = await query.tag.update(id, userId, {
    ...(name !== undefined && { name: name.trim() }),
    ...(color !== undefined && { color }),
  });
  
  const usageCount = await query.tag.getUsageCount(id);
  
  return res.send({
    ...tag,
    usage_count: usageCount,
  });
}

// Delete a tag
async function remove(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  await query.tag.remove(id, userId);
  
  return res.send({
    message: "Tag deleted successfully.",
  });
}

// Get links for a specific tag
async function getLinks(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Verify tag belongs to user
  await query.tag.getById(id, userId);
  
  const links = await query.tag.getLinksByTag(id, userId);
  
  return res.send({
    data: links.map(utils.sanitize.link),
  });
}

// Add tags to a link
async function addToLink(req, res) {
  const { linkId } = req.params;
  const { tag_ids } = req.body;
  const userId = req.user.id;
  
  if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
    throw new CustomError("tag_ids must be a non-empty array.", 400);
  }
  
  // Verify link belongs to user
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  // Verify all tags belong to user
  const tags = await Promise.all(
    tag_ids.map(tagId => query.tag.getById(tagId, userId))
  );
  
  const updatedTags = await query.tag.addToLink(link.id, tag_ids);
  
  return res.send({
    data: updatedTags,
  });
}

// Remove tags from a link
async function removeFromLink(req, res) {
  const { linkId } = req.params;
  const { tag_ids } = req.body;
  const userId = req.user.id;
  
  if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
    throw new CustomError("tag_ids must be a non-empty array.", 400);
  }
  
  // Verify link belongs to user
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const updatedTags = await query.tag.removeFromLink(link.id, tag_ids);
  
  return res.send({
    data: updatedTags || [],
  });
}

module.exports = {
  get,
  getOne,
  create,
  update,
  remove,
  getLinks,
  addToLink,
  removeFromLink,
};
