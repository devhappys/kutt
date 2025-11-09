const { 
  subDays, 
  subHours, 
  startOfDay, 
  startOfWeek, 
  startOfMonth,
  endOfDay,
  format 
} = require("date-fns");
const knex = require("../knex");
const utils = require("../utils");

// Add detailed visit record
async function addDetailedVisit(data) {
  await knex("visit_details").insert({
    link_id: data.link_id,
    user_id: data.user_id,
    ip_address: data.ip_address,
    country: data.country?.toLowerCase(),
    city: data.city,
    region: data.region,
    browser: data.browser?.toLowerCase(),
    browser_version: data.browser_version,
    os: data.os?.toLowerCase(),
    os_version: data.os_version,
    device_type: data.device_type,
    device_brand: data.device_brand,
    device_model: data.device_model,
    referrer: data.referrer,
    referrer_domain: data.referrer_domain,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_term: data.utm_term,
    utm_content: data.utm_content,
    language: data.language,
    screen_resolution: data.screen_resolution,
    is_bot: data.is_bot || false,
    is_unique: data.is_unique || false,
  });
}

// Get visit details with pagination and filters
async function getVisitDetails(linkId, options = {}) {
  const {
    limit = 100,
    skip = 0,
    startDate,
    endDate,
    country,
    browser,
    os,
    deviceType,
    utmSource,
    utmMedium,
    utmCampaign,
    isBot,
  } = options;

  const query = knex("visit_details")
    .where("link_id", linkId)
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(skip);

  if (startDate) {
    query.where("created_at", ">=", startDate);
  }
  
  if (endDate) {
    query.where("created_at", "<=", endDate);
  }
  
  if (country) {
    query.where("country", country.toLowerCase());
  }
  
  if (browser) {
    query.where("browser", browser.toLowerCase());
  }
  
  if (os) {
    query.where("os", os.toLowerCase());
  }
  
  if (deviceType) {
    query.where("device_type", deviceType);
  }
  
  if (utmSource) {
    query.where("utm_source", utmSource);
  }
  
  if (utmMedium) {
    query.where("utm_medium", utmMedium);
  }
  
  if (utmCampaign) {
    query.where("utm_campaign", utmCampaign);
  }
  
  if (isBot !== undefined) {
    query.where("is_bot", isBot);
  }

  const [data, countResult] = await Promise.all([
    query,
    knex("visit_details")
      .where("link_id", linkId)
      .count("* as count")
      .first()
  ]);

  return {
    data,
    total: parseInt(countResult.count, 10),
    limit,
    skip,
  };
}

// Get time-based heatmap data
async function getTimeHeatmap(linkId, period = "week") {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case "day":
      startDate = subHours(now, 24);
      break;
    case "week":
      startDate = subDays(now, 7);
      break;
    case "month":
      startDate = subDays(now, 30);
      break;
    default:
      startDate = subDays(now, 7);
  }

  const visits = await knex("visit_details")
    .where("link_id", linkId)
    .where("created_at", ">=", startDate)
    .select(
      knex.raw("strftime('%H', created_at) as hour"),
      knex.raw("strftime('%w', created_at) as day_of_week"),
      knex.raw("COUNT(*) as count")
    )
    .groupBy("hour", "day_of_week");

  // Create 24x7 matrix (hours x days)
  const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
  
  visits.forEach(visit => {
    const hour = parseInt(visit.hour, 10);
    const day = parseInt(visit.day_of_week, 10);
    heatmap[day][hour] = visit.count;
  });

  return {
    heatmap,
    period,
    startDate,
    endDate: now,
  };
}

// Get UTM campaign statistics
async function getUTMStats(linkId, options = {}) {
  const { startDate, endDate } = options;

  const query = knex("visit_details")
    .where("link_id", linkId)
    .whereNotNull("utm_campaign");

  if (startDate) {
    query.where("created_at", ">=", startDate);
  }
  
  if (endDate) {
    query.where("created_at", "<=", endDate);
  }

  const [campaigns, sources, mediums] = await Promise.all([
    // Group by campaign
    query.clone()
      .select("utm_campaign")
      .count("* as visits")
      .countDistinct("ip_address as unique_visitors")
      .groupBy("utm_campaign")
      .orderBy("visits", "desc")
      .limit(20),
    
    // Group by source
    query.clone()
      .select("utm_source")
      .count("* as visits")
      .groupBy("utm_source")
      .orderBy("visits", "desc")
      .limit(20),
    
    // Group by medium
    query.clone()
      .select("utm_medium")
      .count("* as visits")
      .groupBy("utm_medium")
      .orderBy("visits", "desc")
      .limit(20),
  ]);

  return {
    campaigns: campaigns.map(c => ({
      name: c.utm_campaign,
      visits: parseInt(c.visits, 10),
      unique_visitors: parseInt(c.unique_visitors, 10),
    })),
    sources: sources.map(s => ({
      name: s.utm_source,
      visits: parseInt(s.visits, 10),
    })),
    mediums: mediums.map(m => ({
      name: m.utm_medium,
      visits: parseInt(m.visits, 10),
    })),
  };
}

// Get real-time statistics
async function getRealTimeStats(linkId) {
  const now = new Date();
  const last15Min = subHours(now, 0.25);
  const lastHour = subHours(now, 1);
  const last24Hours = subHours(now, 24);

  const [last15MinCount, lastHourCount, last24HourCount, activeVisitors] = await Promise.all([
    // Last 15 minutes
    knex("visit_details")
      .where("link_id", linkId)
      .where("created_at", ">=", last15Min)
      .count("* as count")
      .first(),
    
    // Last hour
    knex("visit_details")
      .where("link_id", linkId)
      .where("created_at", ">=", lastHour)
      .count("* as count")
      .first(),
    
    // Last 24 hours
    knex("visit_details")
      .where("link_id", linkId)
      .where("created_at", ">=", last24Hours)
      .count("* as count")
      .first(),
    
    // Active visitors (last 5 minutes, unique IPs)
    knex("visit_details")
      .where("link_id", linkId)
      .where("created_at", ">=", subHours(now, 5 / 60))
      .countDistinct("ip_address as count")
      .first(),
  ]);

  // Get recent visits with details
  const recentVisits = await knex("visit_details")
    .where("link_id", linkId)
    .where("created_at", ">=", subHours(now, 1))
    .orderBy("created_at", "desc")
    .limit(10)
    .select(
      "country",
      "city",
      "browser",
      "os",
      "device_type",
      "referrer_domain",
      "utm_campaign",
      "created_at"
    );

  return {
    last_15_min: parseInt(last15MinCount.count, 10),
    last_hour: parseInt(lastHourCount.count, 10),
    last_24_hours: parseInt(last24HourCount.count, 10),
    active_visitors: parseInt(activeVisitors.count, 10),
    recent_visits: recentVisits,
    timestamp: now,
  };
}

// Get conversion funnel data
async function getConversionFunnel(linkIds, options = {}) {
  const { startDate, endDate } = options;
  
  const steps = [];
  
  for (let i = 0; i < linkIds.length; i++) {
    const query = knex("visit_details")
      .where("link_id", linkIds[i]);
    
    if (startDate) {
      query.where("created_at", ">=", startDate);
    }
    
    if (endDate) {
      query.where("created_at", "<=", endDate);
    }
    
    const [totalVisits, uniqueVisitors] = await Promise.all([
      query.clone().count("* as count").first(),
      query.clone().countDistinct("ip_address as count").first(),
    ]);
    
    steps.push({
      step: i + 1,
      link_id: linkIds[i],
      total_visits: parseInt(totalVisits.count, 10),
      unique_visitors: parseInt(uniqueVisitors.count, 10),
      drop_off_rate: i > 0 ? 
        ((steps[i-1].unique_visitors - parseInt(uniqueVisitors.count, 10)) / steps[i-1].unique_visitors * 100).toFixed(2) : 
        0,
    });
  }
  
  return {
    steps,
    total_conversion_rate: steps.length > 1 ? 
      (steps[steps.length - 1].unique_visitors / steps[0].unique_visitors * 100).toFixed(2) : 
      0,
  };
}

// Get comparative stats for A/B testing
async function getABTestStats(linkIds, options = {}) {
  const { startDate, endDate } = options;
  
  const results = [];
  
  for (const linkId of linkIds) {
    const query = knex("visit_details")
      .where("link_id", linkId);
    
    if (startDate) {
      query.where("created_at", ">=", startDate);
    }
    
    if (endDate) {
      query.where("created_at", "<=", endDate);
    }
    
    const [stats, avgDuration] = await Promise.all([
      query.clone()
        .count("* as total_visits")
        .countDistinct("ip_address as unique_visitors")
        .first(),
      
      // This would require additional tracking of session duration
      // For now, return null
      Promise.resolve({ avg_duration: null }),
    ]);
    
    results.push({
      link_id: linkId,
      total_visits: parseInt(stats.total_visits, 10),
      unique_visitors: parseInt(stats.unique_visitors, 10),
      avg_duration: avgDuration.avg_duration,
    });
  }
  
  return results;
}

// Get device breakdown
async function getDeviceStats(linkId, options = {}) {
  const { startDate, endDate } = options;
  
  const query = knex("visit_details")
    .where("link_id", linkId);
  
  if (startDate) {
    query.where("created_at", ">=", startDate);
  }
  
  if (endDate) {
    query.where("created_at", "<=", endDate);
  }
  
  const [deviceTypes, browsers, os] = await Promise.all([
    query.clone()
      .select("device_type")
      .count("* as count")
      .groupBy("device_type")
      .orderBy("count", "desc"),
    
    query.clone()
      .select("browser", "browser_version")
      .count("* as count")
      .groupBy("browser", "browser_version")
      .orderBy("count", "desc")
      .limit(10),
    
    query.clone()
      .select("os", "os_version")
      .count("* as count")
      .groupBy("os", "os_version")
      .orderBy("count", "desc")
      .limit(10),
  ]);
  
  return {
    device_types: deviceTypes.map(d => ({
      type: d.device_type,
      count: parseInt(d.count, 10),
    })),
    browsers: browsers.map(b => ({
      name: b.browser,
      version: b.browser_version,
      count: parseInt(b.count, 10),
    })),
    operating_systems: os.map(o => ({
      name: o.os,
      version: o.os_version,
      count: parseInt(o.count, 10),
    })),
  };
}

module.exports = {
  addDetailedVisit,
  getVisitDetails,
  getTimeHeatmap,
  getUTMStats,
  getRealTimeStats,
  getConversionFunnel,
  getABTestStats,
  getDeviceStats,
};
