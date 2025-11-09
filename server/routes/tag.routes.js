const { Router } = require("express");

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../handlers/auth.handler");
const tag = require("../handlers/tags.handler");

const router = Router();

// Get all tags for current user
router.get(
  "/",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.get)
);

// Get a single tag
router.get(
  "/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.getOne)
);

// Create a new tag
router.post(
  "/",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.create)
);

// Update a tag
router.patch(
  "/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.update)
);

// Delete a tag
router.delete(
  "/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.remove)
);

// Get links for a specific tag
router.get(
  "/:id/links",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.getLinks)
);

// Add tags to a link
router.post(
  "/links/:linkId",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.addToLink)
);

// Remove tags from a link
router.delete(
  "/links/:linkId",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(tag.removeFromLink)
);

module.exports = router;
