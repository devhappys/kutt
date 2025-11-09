const { Router } = require("express");

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../handlers/auth.handler");
const qrcode = require("../handlers/qrcode.handler");

const router = Router();

// Generate QR code for a single link
router.get(
  "/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwtLoose),
  asyncHandler(qrcode.generate)
);

// Generate QR codes for multiple links (batch)
router.post(
  "/batch",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(qrcode.generateBatch)
);

module.exports = router;
