/**
 * Advanced link features handler
 * Handles advanced link configuration like click limits, SEO meta tags, etc.
 */

const query = require("../queries");
const utils = require("../utils");

/**
 * Check if link has reached click limit
 */
async function checkClickLimit(link) {
  if (!link.max_clicks) return { allowed: true };
  
  const now = new Date();
  let clickCount = link.click_count_period || 0;
  let periodStart = link.click_period_start ? new Date(link.click_period_start) : null;
  
  // Determine if we need to reset the period
  let needsReset = false;
  if (!periodStart || link.click_limit_period !== 'total') {
    const periods = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    
    const periodMs = periods[link.click_limit_period];
    if (periodMs && periodStart) {
      needsReset = now - periodStart > periodMs;
    } else if (!periodStart) {
      needsReset = true;
    }
  }
  
  // Reset period if needed
  if (needsReset) {
    clickCount = 0;
    periodStart = now;
    await query.link.update(
      { id: link.id },
      { 
        click_count_period: 0,
        click_period_start: now
      }
    );
  }
  
  // Check limit
  if (clickCount >= link.max_clicks) {
    return {
      allowed: false,
      message: `Link has reached its click limit (${link.max_clicks} clicks per ${link.click_limit_period || 'total'})`,
      remaining: 0
    };
  }
  
  return {
    allowed: true,
    remaining: link.max_clicks - clickCount
  };
}

/**
 * Increment click count for limited links
 */
async function incrementClickCount(link) {
  if (!link.max_clicks) return;
  
  await query.link.update(
    { id: link.id },
    {
      click_count_period: (link.click_count_period || 0) + 1
    }
  );
}

/**
 * Apply default UTM parameters to target URL
 */
function applyUTMParams(targetUrl, link) {
  if (!link.utm_campaign && !link.utm_source && !link.utm_medium) {
    return targetUrl;
  }
  
  try {
    const url = new URL(targetUrl);
    
    if (link.utm_campaign) url.searchParams.set('utm_campaign', link.utm_campaign);
    if (link.utm_source) url.searchParams.set('utm_source', link.utm_source);
    if (link.utm_medium) url.searchParams.set('utm_medium', link.utm_medium);
    
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return targetUrl;
  }
}

/**
 * Get SEO meta tags for link preview
 */
function getMetaTags(link) {
  return {
    title: link.meta_title || link.description || `Short link: ${link.address}`,
    description: link.meta_description || link.description || `Redirects to: ${link.target}`,
    image: link.meta_image || null,
    url: utils.getShortURL(link.address, link.domain).url
  };
}

/**
 * Validate advanced link options
 */
function validateAdvancedOptions(options) {
  const errors = [];
  
  if (options.max_clicks !== undefined) {
    if (!Number.isInteger(options.max_clicks) || options.max_clicks < 1 || options.max_clicks > 1000000) {
      errors.push('max_clicks must be between 1 and 1,000,000');
    }
    
    if (options.max_clicks && !options.click_limit_period) {
      errors.push('click_limit_period is required when max_clicks is set');
    }
  }
  
  if (options.click_limit_period) {
    const validPeriods = ['hour', 'day', 'week', 'month', 'total'];
    if (!validPeriods.includes(options.click_limit_period)) {
      errors.push(`click_limit_period must be one of: ${validPeriods.join(', ')}`);
    }
  }
  
  if (options.redirect_type) {
    const validTypes = ['301', '302', '307'];
    if (!validTypes.includes(options.redirect_type)) {
      errors.push(`redirect_type must be one of: ${validTypes.join(', ')}`);
    }
  }
  
  if (options.meta_title && options.meta_title.length > 200) {
    errors.push('meta_title maximum length is 200 characters');
  }
  
  if (options.meta_description && options.meta_description.length > 500) {
    errors.push('meta_description maximum length is 500 characters');
  }
  
  if (options.meta_image) {
    try {
      new URL(options.meta_image);
    } catch {
      errors.push('meta_image must be a valid URL');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

module.exports = {
  checkClickLimit,
  incrementClickCount,
  applyUTMParams,
  getMetaTags,
  validateAdvancedOptions
};
