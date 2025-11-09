const useragent = require("useragent");
const query = require("../queries");
const utils = require("../utils");

const CustomError = utils.CustomError;

/**
 * Enhanced redirect middleware with security and smart redirect support
 */
async function enhancedRedirectCheck(req, link) {
  const checks = {
    passed: true,
    reason: null,
    redirect_url: null,
  };

  // Parse user agent
  const agent = useragent.parse(req.headers["user-agent"] || "");
  const device = agent.device.family === "Other" ? "desktop" : 
                 (agent.device.family.toLowerCase().includes("mobile") ? "mobile" : "tablet");
  const browser = agent.family.toLowerCase();
  const os = agent.os.family.toLowerCase();
  
  // Get geo info
  const country = req.get("cf-ipcountry") || req.headers["x-country-code"];
  const language = req.headers["accept-language"]?.split(",")[0]?.split("-")[0];
  const ipAddress = req.ip;
  const referrer = req.get("Referrer") || req.get("Referer");

  // 1. Check IP restrictions
  if (link.ip_restriction_enabled) {
    const ipCheck = await query.security.checkIPAccess(link.id, ipAddress);
    if (!ipCheck.allowed) {
      checks.passed = false;
      checks.reason = ipCheck.reason || "IP address is not allowed";
      return checks;
    }
  }

  // 2. Check geo restrictions
  if (link.geo_restriction_enabled && country) {
    const geoCheck = await query.security.checkGeoAccess(link.id, country);
    if (!geoCheck.allowed) {
      checks.passed = false;
      checks.reason = geoCheck.reason || "Geographic location is not allowed";
      checks.redirect_url = geoCheck.redirect_url;
      return checks;
    }
  }

  // 3. Check rate limiting
  if (link.rate_limit_enabled) {
    const rateLimitCheck = await query.security.checkRateLimit(
      link.id,
      ipAddress,
      req.headers["user-agent"]
    );
    
    if (!rateLimitCheck.allowed) {
      checks.passed = false;
      checks.reason = rateLimitCheck.reason || "Rate limit exceeded";
      checks.retry_after = rateLimitCheck.retry_after;
      checks.blocked_until = rateLimitCheck.blocked_until;
      return checks;
    }
  }

  // 4. Check smart redirect rules
  if (link.smart_redirect_enabled) {
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    
    const redirectRule = await query.security.getMatchingRedirectRule(link.id, {
      device,
      browser,
      os,
      country: country?.toLowerCase(),
      language,
      referrer,
      currentTime,
    });

    if (redirectRule) {
      checks.redirect_url = redirectRule.target_url;
      checks.matched_rule = redirectRule.rule_name;
    }
  }

  return checks;
}

/**
 * Apply enhanced redirect checks
 */
async function applySecurityAndSmartRedirect(req, res, next, link) {
  try {
    const checkResult = await enhancedRedirectCheck(req, link);

    // If security check failed
    if (!checkResult.passed) {
      if (checkResult.reason === "Rate limit exceeded") {
        res.setHeader("Retry-After", checkResult.retry_after);
        res.setHeader("X-RateLimit-Reset", checkResult.blocked_until);
        
        return res.status(429).send({
          error: checkResult.reason,
          retry_after: checkResult.retry_after,
          blocked_until: checkResult.blocked_until,
        });
      }

      // For other security failures, redirect to alternative URL or show error
      if (checkResult.redirect_url) {
        return res.redirect(checkResult.redirect_url);
      }

      return res.status(403).send({
        error: checkResult.reason || "Access denied",
      });
    }

    // If smart redirect rule matched
    if (checkResult.redirect_url) {
      return res.redirect(checkResult.redirect_url);
    }

    // No redirect rule matched, continue to original target
    return null;
  } catch (error) {
    // Log error but don't block the redirect
    console.error("Error in security/smart redirect check:", error);
    return null;
  }
}

module.exports = {
  enhancedRedirectCheck,
  applySecurityAndSmartRedirect,
};
