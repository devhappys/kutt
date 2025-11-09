const query = require("../queries");
const utils = require("../utils");

const CustomError = utils.CustomError;

// ==================== IP Rules ====================

async function getIPRules(req, res) {
  const { linkId } = req.params;
  const userId = req.user.id;
  
  // Verify link ownership
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const rules = await query.security.getIPRules({ link_id: link.id });
  
  return res.send({
    data: rules,
  });
}

async function addIPRule(req, res) {
  const { linkId } = req.params;
  const { ip_address, ip_range, rule_type, reason } = req.body;
  const userId = req.user.id;
  
  if (!ip_address && !ip_range) {
    throw new CustomError("Either ip_address or ip_range is required.", 400);
  }
  
  if (!["blacklist", "whitelist"].includes(rule_type)) {
    throw new CustomError("rule_type must be 'blacklist' or 'whitelist'.", 400);
  }
  
  // Verify link ownership
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const rule = await query.security.addIPRule({
    link_id: link.id,
    user_id: userId,
    ip_address,
    ip_range,
    rule_type,
    reason,
  });
  
  // Enable IP restriction on link
  await query.link.update({ id: link.id }, { ip_restriction_enabled: true });
  
  return res.status(201).send(rule);
}

async function updateIPRule(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const { ip_address, ip_range, rule_type, reason, is_active } = req.body;
  
  const rule = await query.security.updateIPRule(id, userId, {
    ...(ip_address !== undefined && { ip_address }),
    ...(ip_range !== undefined && { ip_range }),
    ...(rule_type !== undefined && { rule_type }),
    ...(reason !== undefined && { reason }),
    ...(is_active !== undefined && { is_active }),
  });
  
  if (!rule) {
    throw new CustomError("IP rule not found or access denied.", 404);
  }
  
  return res.send(rule);
}

async function deleteIPRule(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const deleted = await query.security.deleteIPRule(id, userId);
  
  if (!deleted) {
    throw new CustomError("IP rule not found or access denied.", 404);
  }
  
  return res.send({ message: "IP rule deleted successfully." });
}

// ==================== Geo Restrictions ====================

async function getGeoRestrictions(req, res) {
  const { linkId } = req.params;
  const userId = req.user.id;
  
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const restrictions = await query.security.getGeoRestrictions(link.id);
  
  return res.send({
    data: restrictions,
  });
}

async function addGeoRestriction(req, res) {
  const { linkId } = req.params;
  const { country_code, region, city, restriction_type, redirect_url } = req.body;
  const userId = req.user.id;
  
  if (!["allow", "block"].includes(restriction_type)) {
    throw new CustomError("restriction_type must be 'allow' or 'block'.", 400);
  }
  
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const restriction = await query.security.addGeoRestriction({
    link_id: link.id,
    country_code,
    region,
    city,
    restriction_type,
    redirect_url,
  });
  
  // Enable geo restriction on link
  await query.link.update({ id: link.id }, { geo_restriction_enabled: true });
  
  return res.status(201).send(restriction);
}

async function deleteGeoRestriction(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const deleted = await query.security.deleteGeoRestriction(id, userId);
  
  if (!deleted) {
    throw new CustomError("Geo restriction not found or access denied.", 404);
  }
  
  return res.send({ message: "Geo restriction deleted successfully." });
}

// ==================== Rate Limit Rules ====================

async function getRateLimitRules(req, res) {
  const { linkId } = req.params;
  const userId = req.user.id;
  
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const rules = await query.security.getRateLimitRules({ link_id: link.id });
  
  return res.send({
    data: rules,
  });
}

async function addRateLimitRule(req, res) {
  const { linkId } = req.params;
  const { max_requests, window_seconds, action, block_duration_minutes } = req.body;
  const userId = req.user.id;
  
  if (!max_requests || !window_seconds) {
    throw new CustomError("max_requests and window_seconds are required.", 400);
  }
  
  if (action && !["block", "throttle", "captcha"].includes(action)) {
    throw new CustomError("action must be 'block', 'throttle', or 'captcha'.", 400);
  }
  
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const rule = await query.security.addRateLimitRule({
    link_id: link.id,
    user_id: userId,
    max_requests,
    window_seconds,
    action,
    block_duration_minutes,
  });
  
  // Enable rate limiting on link
  await query.link.update({ id: link.id }, { rate_limit_enabled: true });
  
  return res.status(201).send(rule);
}

async function deleteRateLimitRule(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const deleted = await query.security.deleteRateLimitRule(id, userId);
  
  if (!deleted) {
    throw new CustomError("Rate limit rule not found or access denied.", 404);
  }
  
  return res.send({ message: "Rate limit rule deleted successfully." });
}

// ==================== Smart Redirect Rules ====================

async function getRedirectRules(req, res) {
  const { linkId } = req.params;
  const userId = req.user.id;
  
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const rules = await query.security.getRedirectRules(link.id);
  
  // Parse condition_value JSON
  const parsedRules = rules.map(rule => ({
    ...rule,
    condition_value: typeof rule.condition_value === "string" 
      ? JSON.parse(rule.condition_value) 
      : rule.condition_value,
  }));
  
  return res.send({
    data: parsedRules,
  });
}

async function addRedirectRule(req, res) {
  const { linkId } = req.params;
  const { 
    rule_name, 
    priority, 
    condition_type, 
    condition_value, 
    target_url,
    time_start,
    time_end,
    days_of_week 
  } = req.body;
  const userId = req.user.id;
  
  if (!rule_name || !condition_type || !condition_value || !target_url) {
    throw new CustomError("rule_name, condition_type, condition_value, and target_url are required.", 400);
  }
  
  const validTypes = ["device", "browser", "os", "country", "language", "time", "referrer", "custom"];
  if (!validTypes.includes(condition_type)) {
    throw new CustomError(`condition_type must be one of: ${validTypes.join(", ")}`, 400);
  }
  
  const link = await query.link.find({ uuid: linkId, user_id: userId });
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const rule = await query.security.addRedirectRule({
    link_id: link.id,
    rule_name,
    priority,
    condition_type,
    condition_value,
    target_url,
    time_start,
    time_end,
    days_of_week,
  });
  
  // Enable smart redirect on link
  await query.link.update({ id: link.id }, { smart_redirect_enabled: true });
  
  // Parse condition_value for response
  const parsedRule = {
    ...rule,
    condition_value: typeof rule.condition_value === "string" 
      ? JSON.parse(rule.condition_value) 
      : rule.condition_value,
  };
  
  return res.status(201).send(parsedRule);
}

async function updateRedirectRule(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const { rule_name, priority, condition_value, target_url, time_start, time_end, days_of_week, is_active } = req.body;
  
  const rule = await query.security.updateRedirectRule(id, userId, {
    ...(rule_name !== undefined && { rule_name }),
    ...(priority !== undefined && { priority }),
    ...(condition_value !== undefined && { condition_value }),
    ...(target_url !== undefined && { target_url }),
    ...(time_start !== undefined && { time_start }),
    ...(time_end !== undefined && { time_end }),
    ...(days_of_week !== undefined && { days_of_week }),
    ...(is_active !== undefined && { is_active }),
  });
  
  if (!rule) {
    throw new CustomError("Redirect rule not found or access denied.", 404);
  }
  
  // Parse condition_value for response
  const parsedRule = {
    ...rule,
    condition_value: typeof rule.condition_value === "string" 
      ? JSON.parse(rule.condition_value) 
      : rule.condition_value,
  };
  
  return res.send(parsedRule);
}

async function deleteRedirectRule(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const deleted = await query.security.deleteRedirectRule(id, userId);
  
  if (!deleted) {
    throw new CustomError("Redirect rule not found or access denied.", 404);
  }
  
  return res.send({ message: "Redirect rule deleted successfully." });
}

module.exports = {
  // IP Rules
  getIPRules,
  addIPRule,
  updateIPRule,
  deleteIPRule,
  
  // Geo Restrictions
  getGeoRestrictions,
  addGeoRestriction,
  deleteGeoRestriction,
  
  // Rate Limit Rules
  getRateLimitRules,
  addRateLimitRule,
  deleteRateLimitRule,
  
  // Smart Redirect Rules
  getRedirectRules,
  addRedirectRule,
  updateRedirectRule,
  deleteRedirectRule,
};
