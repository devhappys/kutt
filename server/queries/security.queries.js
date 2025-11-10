const knex = require("../knex");
const { now: tzNow, formatDateForDB } = require("../utils/timezone");
const utils = require("../utils");
const { isWithinInterval, parse } = require("date-fns");

const CustomError = utils.CustomError;

// ==================== IP Rules ====================

// Check if IP is allowed to access link
async function checkIPAccess(linkId, ipAddress) {
  const rules = await knex("ip_rules")
    .where({ link_id: linkId, is_active: true })
    .orderBy("rule_type", "desc"); // whitelist first, then blacklist

  if (rules.length === 0) {
    return { allowed: true };
  }

  // Check whitelist rules first
  const whitelistRules = rules.filter(r => r.rule_type === "whitelist");
  if (whitelistRules.length > 0) {
    const isWhitelisted = whitelistRules.some(rule => 
      rule.ip_address === ipAddress || matchIPRange(ipAddress, rule.ip_range)
    );
    return { 
      allowed: isWhitelisted, 
      reason: isWhitelisted ? null : "IP not in whitelist" 
    };
  }

  // Check blacklist rules
  const blacklistRules = rules.filter(r => r.rule_type === "blacklist");
  const isBlacklisted = blacklistRules.some(rule => 
    rule.ip_address === ipAddress || matchIPRange(ipAddress, rule.ip_range)
  );
  
  return { 
    allowed: !isBlacklisted, 
    reason: isBlacklisted ? "IP is blacklisted" : null 
  };
}

// Add IP rule
async function addIPRule(data) {
  const { link_id, user_id, ip_address, ip_range, rule_type, reason } = data;
  
  const [id] = await knex("ip_rules").insert({
    link_id,
    user_id,
    ip_address,
    ip_range,
    rule_type,
    reason,
    is_active: true,
  });
  
  return knex("ip_rules").where({ id }).first();
}

// Get IP rules for link or user
async function getIPRules(filters) {
  const query = knex("ip_rules");
  
  if (filters.link_id) {
    query.where("link_id", filters.link_id);
  }
  
  if (filters.user_id) {
    query.where("user_id", filters.user_id);
  }
  
  if (filters.rule_type) {
    query.where("rule_type", filters.rule_type);
  }
  
  return query.orderBy("created_at", "desc");
}

// Update IP rule
async function updateIPRule(id, userId, data) {
  await knex("ip_rules")
    .where({ id })
    .where(function() {
      this.where("user_id", userId).orWhereNull("user_id");
    })
    .update({
      ...data,
      updated_at: knex.fn.now(),
    });
  
  return knex("ip_rules").where({ id }).first();
}

// Delete IP rule
async function deleteIPRule(id, userId) {
  return knex("ip_rules")
    .where({ id })
    .where(function() {
      this.where("user_id", userId).orWhereNull("user_id");
    })
    .delete();
}

// Simple IP range matching (basic CIDR support)
function matchIPRange(ip, range) {
  if (!range) return false;
  
  // TODO: Implement proper CIDR matching
  // For now, just do exact match
  return ip === range;
}

// ==================== Geo Restrictions ====================

// Check if geo location is allowed
async function checkGeoAccess(linkId, countryCode, region = null, city = null) {
  const restrictions = await knex("geo_restrictions")
    .where({ link_id: linkId });

  if (restrictions.length === 0) {
    return { allowed: true };
  }

  // Check if there's a matching restriction
  for (const restriction of restrictions) {
    let matches = true;
    
    if (restriction.country_code && restriction.country_code.toLowerCase() !== countryCode.toLowerCase()) {
      matches = false;
    }
    
    if (matches && restriction.region && region && restriction.region.toLowerCase() !== region.toLowerCase()) {
      matches = false;
    }
    
    if (matches && restriction.city && city && restriction.city.toLowerCase() !== city.toLowerCase()) {
      matches = false;
    }
    
    if (matches) {
      return {
        allowed: restriction.restriction_type === "allow",
        redirect_url: restriction.redirect_url,
        reason: restriction.restriction_type === "block" ? "Geographic location blocked" : null
      };
    }
  }

  // If no matching restriction, check if there are any "allow" rules
  const hasAllowRules = restrictions.some(r => r.restriction_type === "allow");
  return { 
    allowed: !hasAllowRules,
    reason: hasAllowRules ? "Geographic location not in allowed list" : null
  };
}

// Add geo restriction
async function addGeoRestriction(data) {
  const { link_id, country_code, region, city, restriction_type, redirect_url } = data;
  
  const [id] = await knex("geo_restrictions").insert({
    link_id,
    country_code: country_code?.toLowerCase(),
    region,
    city,
    restriction_type,
    redirect_url,
  });
  
  return knex("geo_restrictions").where({ id }).first();
}

// Get geo restrictions for link
async function getGeoRestrictions(linkId) {
  return knex("geo_restrictions")
    .where("link_id", linkId)
    .orderBy("created_at", "desc");
}

// Delete geo restriction
async function deleteGeoRestriction(id, userId) {
  return knex("geo_restrictions")
    .whereExists(function() {
      this.select("*")
        .from("links")
        .whereRaw("links.id = geo_restrictions.link_id")
        .where("links.user_id", userId);
    })
    .where("geo_restrictions.id", id)
    .delete();
}

// ==================== Rate Limiting ====================

// Check if request is allowed (rate limit)
async function checkRateLimit(linkId, ipAddress, userAgent) {
  const now = new Date();
  
  // Get active rate limit rules for this link
  const rules = await knex("rate_limit_rules")
    .where({ link_id: linkId, is_active: true })
    .orWhere({ user_id: null, is_active: true }); // Global rules

  if (rules.length === 0) {
    return { allowed: true };
  }

  for (const rule of rules) {
    // Check if IP is currently blocked
    const violation = await knex("rate_limit_violations")
      .where({ rule_id: rule.id, ip_address: ipAddress })
      .where("blocked_until", ">", now)
      .first();

    if (violation) {
      return {
        allowed: false,
        reason: "Rate limit exceeded",
        blocked_until: violation.blocked_until,
        retry_after: Math.ceil((new Date(violation.blocked_until) - now) / 1000)
      };
    }

    // Count requests in the time window
    const windowStart = new Date(now - rule.window_seconds * 1000);
    const requestCount = await knex("visit_details")
      .where({ link_id: linkId, ip_address: ipAddress })
      .where("created_at", ">=", windowStart)
      .count("* as count")
      .first();

    const count = parseInt(requestCount.count, 10);

    if (count >= rule.max_requests) {
      // Record violation
      const blockDuration = parseInt(rule.block_duration_minutes, 10);
      const blockedUntil = new Date(now.getTime() + blockDuration * 60 * 1000);

      await knex("rate_limit_violations").insert({
        rule_id: rule.id,
        link_id: linkId,
        ip_address: ipAddress,
        request_count: count,
        blocked_until: blockedUntil,
        user_agent: userAgent,
      });

      return {
        allowed: false,
        reason: "Rate limit exceeded",
        blocked_until: blockedUntil,
        retry_after: blockDuration * 60
      };
    }
  }

  return { allowed: true };
}

// Add rate limit rule
async function addRateLimitRule(data) {
  const { link_id, user_id, max_requests, window_seconds, action, block_duration_minutes } = data;
  
  const [id] = await knex("rate_limit_rules").insert({
    link_id,
    user_id,
    max_requests,
    window_seconds,
    action,
    block_duration_minutes: block_duration_minutes || "60",
    is_active: true,
  });
  
  return knex("rate_limit_rules").where({ id }).first();
}

// Get rate limit rules
async function getRateLimitRules(filters) {
  const query = knex("rate_limit_rules");
  
  if (filters.link_id) {
    query.where("link_id", filters.link_id);
  }
  
  if (filters.user_id) {
    query.where("user_id", filters.user_id);
  }
  
  return query.orderBy("created_at", "desc");
}

// Delete rate limit rule
async function deleteRateLimitRule(id, userId) {
  return knex("rate_limit_rules")
    .where({ id })
    .where(function() {
      this.where("user_id", userId).orWhereNull("user_id");
    })
    .delete();
}

// ==================== Smart Redirect Rules ====================

// Get matching redirect rule
async function getMatchingRedirectRule(linkId, context) {
  const { device, browser, os, country, language, referrer, currentTime } = context;
  
  const rules = await knex("redirect_rules")
    .where({ link_id: linkId, is_active: true })
    .orderBy("priority", "desc");

  if (rules.length === 0) {
    return null;
  }

  for (const rule of rules) {
    let matches = true;

    switch (rule.condition_type) {
      case "device":
        const deviceValue = typeof rule.condition_value === "string" 
          ? JSON.parse(rule.condition_value) 
          : rule.condition_value;
        matches = deviceValue.device === device || 
                  (Array.isArray(deviceValue.device) && deviceValue.device.includes(device));
        break;

      case "browser":
        const browserValue = typeof rule.condition_value === "string" 
          ? JSON.parse(rule.condition_value) 
          : rule.condition_value;
        matches = browserValue.browser === browser || 
                  (Array.isArray(browserValue.browser) && browserValue.browser.includes(browser));
        break;

      case "os":
        const osValue = typeof rule.condition_value === "string" 
          ? JSON.parse(rule.condition_value) 
          : rule.condition_value;
        matches = osValue.os === os || 
                  (Array.isArray(osValue.os) && osValue.os.includes(os));
        break;

      case "country":
        const countryValue = typeof rule.condition_value === "string" 
          ? JSON.parse(rule.condition_value) 
          : rule.condition_value;
        matches = countryValue.country === country || 
                  (Array.isArray(countryValue.country) && countryValue.country.includes(country?.toLowerCase()));
        break;

      case "language":
        const langValue = typeof rule.condition_value === "string" 
          ? JSON.parse(rule.condition_value) 
          : rule.condition_value;
        matches = langValue.language === language || 
                  (Array.isArray(langValue.language) && langValue.language.includes(language));
        break;

      case "time":
        if (rule.time_start && rule.time_end && currentTime) {
          const current = currentTime.split(":").slice(0, 2).join(":");
          matches = current >= rule.time_start && current <= rule.time_end;
        }
        if (matches && rule.days_of_week && currentTime) {
          const dayOfWeek = new Date().getDay();
          const allowedDays = rule.days_of_week.split(",").map(d => parseInt(d, 10));
          matches = allowedDays.includes(dayOfWeek);
        }
        break;

      case "referrer":
        const refValue = typeof rule.condition_value === "string" 
          ? JSON.parse(rule.condition_value) 
          : rule.condition_value;
        if (refValue.referrer && referrer) {
          matches = referrer.includes(refValue.referrer);
        }
        break;
    }

    if (matches) {
      return rule;
    }
  }

  return null;
}

// Add redirect rule
async function addRedirectRule(data) {
  const { 
    link_id, 
    rule_name, 
    priority, 
    condition_type, 
    condition_value, 
    target_url,
    time_start,
    time_end,
    days_of_week 
  } = data;
  
  const [id] = await knex("redirect_rules").insert({
    link_id,
    rule_name,
    priority: priority || 0,
    condition_type,
    condition_value: JSON.stringify(condition_value),
    target_url,
    time_start,
    time_end,
    days_of_week,
    is_active: true,
  });
  
  return knex("redirect_rules").where({ id }).first();
}

// Get redirect rules for link
async function getRedirectRules(linkId) {
  return knex("redirect_rules")
    .where("link_id", linkId)
    .orderBy("priority", "desc");
}

// Update redirect rule
async function updateRedirectRule(id, userId, data) {
  await knex("redirect_rules")
    .whereExists(function() {
      this.select("*")
        .from("links")
        .whereRaw("links.id = redirect_rules.link_id")
        .where("links.user_id", userId);
    })
    .where("redirect_rules.id", id)
    .update({
      ...data,
      ...(data.condition_value && { condition_value: JSON.stringify(data.condition_value) }),
      updated_at: knex.fn.now(),
    });
  
  return knex("redirect_rules").where({ id }).first();
}

// Delete redirect rule
async function deleteRedirectRule(id, userId) {
  return knex("redirect_rules")
    .whereExists(function() {
      this.select("*")
        .from("links")
        .whereRaw("links.id = redirect_rules.link_id")
        .where("links.user_id", userId);
    })
    .where("redirect_rules.id", id)
    .delete();
}

module.exports = {
  // IP Rules
  checkIPAccess,
  addIPRule,
  getIPRules,
  updateIPRule,
  deleteIPRule,
  
  // Geo Restrictions
  checkGeoAccess,
  addGeoRestriction,
  getGeoRestrictions,
  deleteGeoRestriction,
  
  // Rate Limiting
  checkRateLimit,
  addRateLimitRule,
  getRateLimitRules,
  deleteRateLimitRule,
  
  // Smart Redirect
  getMatchingRedirectRule,
  addRedirectRule,
  getRedirectRules,
  updateRedirectRule,
  deleteRedirectRule,
};
