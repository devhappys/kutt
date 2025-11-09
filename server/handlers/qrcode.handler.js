const QRCode = require("qrcode");
const query = require("../queries");
const utils = require("../utils");

const CustomError = utils.CustomError;

// Generate QR code for a link
async function generate(req, res) {
  const { id } = req.params;
  const userId = req.user?.id;
  const format = req.query.format || "png"; // png, svg, or dataurl
  const size = parseInt(req.query.size) || 300;
  const color = req.query.color || "#000000";
  const bgColor = req.query.bgColor || "#ffffff";
  
  // Validate format
  if (!["png", "svg", "dataurl"].includes(format)) {
    throw new CustomError("Invalid format. Use 'png', 'svg', or 'dataurl'.", 400);
  }
  
  // Validate size
  if (size < 100 || size > 2000) {
    throw new CustomError("Size must be between 100 and 2000 pixels.", 400);
  }
  
  // Find the link
  const link = userId 
    ? await query.link.find({ uuid: id, user_id: userId })
    : await query.link.find({ uuid: id });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  // Build the full URL
  const domain = link.domain || req.get("host");
  const protocol = req.protocol;
  const fullUrl = `${protocol}://${domain}/${link.address}`;
  
  const options = {
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: bgColor,
    },
    errorCorrectionLevel: "M",
  };
  
  try {
    if (format === "svg") {
      // Generate SVG
      const svg = await QRCode.toString(fullUrl, {
        ...options,
        type: "svg",
      });
      
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Content-Disposition", `inline; filename="${link.address}.svg"`);
      return res.send(svg);
    } else if (format === "dataurl") {
      // Generate data URL
      const dataUrl = await QRCode.toDataURL(fullUrl, options);
      
      return res.send({
        data_url: dataUrl,
        link: fullUrl,
      });
    } else {
      // Generate PNG (default)
      const buffer = await QRCode.toBuffer(fullUrl, options);
      
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="${link.address}.png"`);
      return res.send(buffer);
    }
  } catch (error) {
    throw new CustomError("Failed to generate QR code.", 500);
  }
}

// Generate QR code for multiple links (batch)
async function generateBatch(req, res) {
  const { link_ids } = req.body;
  const userId = req.user.id;
  const format = req.query.format || "dataurl";
  const size = parseInt(req.query.size) || 300;
  
  if (!Array.isArray(link_ids) || link_ids.length === 0) {
    throw new CustomError("link_ids must be a non-empty array.", 400);
  }
  
  if (link_ids.length > 50) {
    throw new CustomError("Maximum 50 links per batch request.", 400);
  }
  
  // Validate format
  if (!["dataurl"].includes(format)) {
    throw new CustomError("Batch generation only supports 'dataurl' format.", 400);
  }
  
  const options = {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  };
  
  const results = [];
  
  for (const linkId of link_ids) {
    try {
      const link = await query.link.find({ uuid: linkId, user_id: userId });
      
      if (!link) {
        results.push({
          link_id: linkId,
          error: "Link not found",
        });
        continue;
      }
      
      const domain = link.domain || req.get("host");
      const protocol = req.protocol;
      const fullUrl = `${protocol}://${domain}/${link.address}`;
      
      const dataUrl = await QRCode.toDataURL(fullUrl, options);
      
      results.push({
        link_id: linkId,
        address: link.address,
        data_url: dataUrl,
        link: fullUrl,
      });
    } catch (error) {
      results.push({
        link_id: linkId,
        error: "Failed to generate QR code",
      });
    }
  }
  
  return res.send({
    data: results,
  });
}

module.exports = {
  generate,
  generateBatch,
};
