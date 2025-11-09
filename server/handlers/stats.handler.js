const query = require("../queries");
const utils = require("../utils");
const knex = require("../knex");
const { Parser } = require("json2csv");

const CustomError = utils.CustomError;

// Get detailed visit records
async function getVisitDetails(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Find link and verify ownership
  const link = await query.link.find({ uuid: id, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const options = {
    limit: parseInt(req.query.limit) || 100,
    skip: parseInt(req.query.skip) || 0,
    startDate: req.query.start_date,
    endDate: req.query.end_date,
    country: req.query.country,
    browser: req.query.browser,
    os: req.query.os,
    deviceType: req.query.device_type,
    utmSource: req.query.utm_source,
    utmMedium: req.query.utm_medium,
    utmCampaign: req.query.utm_campaign,
    isBot: req.query.is_bot !== undefined ? req.query.is_bot === "true" : undefined,
  };
  
  const result = await query.stats.getVisitDetails(link.id, options);
  
  return res.send(result);
}

// Get time-based heatmap
async function getTimeHeatmap(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const period = req.query.period || "week"; // day, week, month
  
  const link = await query.link.find({ uuid: id, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const heatmap = await query.stats.getTimeHeatmap(link.id, period);
  
  return res.send(heatmap);
}

// Get UTM campaign statistics
async function getUTMStats(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const link = await query.link.find({ uuid: id, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const options = {
    startDate: req.query.start_date,
    endDate: req.query.end_date,
  };
  
  const utmStats = await query.stats.getUTMStats(link.id, options);
  
  return res.send(utmStats);
}

// Get real-time statistics
async function getRealTimeStats(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const link = await query.link.find({ uuid: id, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const realTimeStats = await query.stats.getRealTimeStats(link.id);
  
  return res.send(realTimeStats);
}

// Get conversion funnel
async function getConversionFunnel(req, res) {
  const userId = req.user.id;
  const { link_ids } = req.body;
  
  if (!Array.isArray(link_ids) || link_ids.length < 2) {
    throw new CustomError("At least 2 link IDs are required for funnel analysis.", 400);
  }
  
  if (link_ids.length > 10) {
    throw new CustomError("Maximum 10 steps allowed in funnel.", 400);
  }
  
  // Verify all links belong to user and get their IDs
  const links = await Promise.all(
    link_ids.map(uuid => query.link.find({ uuid, user_id: userId }))
  );
  
  if (links.some(link => !link)) {
    throw new CustomError("One or more links not found.", 404);
  }
  
  const linkInternalIds = links.map(link => link.id);
  
  const options = {
    startDate: req.query.start_date,
    endDate: req.query.end_date,
  };
  
  const funnel = await query.stats.getConversionFunnel(linkInternalIds, options);
  
  // Add link addresses to response
  funnel.steps = funnel.steps.map((step, index) => ({
    ...step,
    link_address: links[index].address,
    link_uuid: link_ids[index],
  }));
  
  return res.send(funnel);
}

// Get A/B test statistics
async function getABTestStats(req, res) {
  const userId = req.user.id;
  const { link_ids } = req.body;
  
  if (!Array.isArray(link_ids) || link_ids.length < 2) {
    throw new CustomError("At least 2 link IDs are required for A/B testing.", 400);
  }
  
  if (link_ids.length > 5) {
    throw new CustomError("Maximum 5 variants allowed in A/B test.", 400);
  }
  
  // Verify all links belong to user
  const links = await Promise.all(
    link_ids.map(uuid => query.link.find({ uuid, user_id: userId }))
  );
  
  if (links.some(link => !link)) {
    throw new CustomError("One or more links not found.", 404);
  }
  
  const linkInternalIds = links.map(link => link.id);
  
  const options = {
    startDate: req.query.start_date,
    endDate: req.query.end_date,
  };
  
  const abStats = await query.stats.getABTestStats(linkInternalIds, options);
  
  // Add link addresses and calculate relative performance
  const totalVisits = abStats.reduce((sum, stat) => sum + stat.total_visits, 0);
  
  const enrichedStats = abStats.map((stat, index) => {
    const link = links[index];
    return {
      ...stat,
      link_address: link.address,
      link_uuid: link_ids[index],
      link_target: link.target,
      percentage_of_total: totalVisits > 0 ? 
        ((stat.total_visits / totalVisits) * 100).toFixed(2) : 0,
      conversion_rate: stat.total_visits > 0 ?
        ((stat.unique_visitors / stat.total_visits) * 100).toFixed(2) : 0,
    };
  });
  
  return res.send({
    variants: enrichedStats,
    summary: {
      total_visits: totalVisits,
      total_unique_visitors: abStats.reduce((sum, stat) => sum + stat.unique_visitors, 0),
      best_performing: enrichedStats.reduce((best, current) => 
        current.total_visits > best.total_visits ? current : best
      ),
    },
  });
}

// Get device statistics
async function getDeviceStats(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  const link = await query.link.find({ uuid: id, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const options = {
    startDate: req.query.start_date,
    endDate: req.query.end_date,
  };
  
  const deviceStats = await query.stats.getDeviceStats(link.id, options);
  
  return res.send(deviceStats);
}

// Export statistics to CSV
async function exportStats(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const format = req.query.format || "csv"; // csv or json
  
  const link = await query.link.find({ uuid: id, user_id: userId });
  
  if (!link) {
    throw new CustomError("Link not found.", 404);
  }
  
  const options = {
    limit: 10000, // Max export limit
    skip: 0,
    startDate: req.query.start_date,
    endDate: req.query.end_date,
  };
  
  const result = await query.stats.getVisitDetails(link.id, options);
  
  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${link.address}-stats.json"`);
    return res.send({
      link: {
        address: link.address,
        target: link.target,
        created_at: link.created_at,
      },
      visits: result.data,
      exported_at: new Date(),
    });
  } else {
    // Export as CSV
    const fields = [
      "created_at",
      "country",
      "city",
      "browser",
      "browser_version",
      "os",
      "os_version",
      "device_type",
      "referrer_domain",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "is_bot",
    ];
    
    try {
      const parser = new Parser({ fields });
      const csv = parser.parse(result.data);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${link.address}-stats.csv"`);
      return res.send(csv);
    } catch (error) {
      throw new CustomError("Failed to export statistics.", 500);
    }
  }
}

// Get dashboard summary for user
async function getDashboard(req, res) {
  const userId = req.user.id;
  
  // Get user's top links
  const topLinks = await knex("links")
    .where("user_id", userId)
    .orderBy("visit_count", "desc")
    .limit(10)
    .select("id", "uuid", "address", "target", "visit_count", "created_at");
  
  // Get recent activity (last 24 hours)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentActivity = await knex("visit_details")
    .where("user_id", userId)
    .where("created_at", ">=", last24Hours)
    .count("* as count")
    .first();
  
  // Get total stats
  const totalStats = await knex("links")
    .where("user_id", userId)
    .sum("visit_count as total_visits")
    .count("* as total_links")
    .first();
  
  // Get top campaigns
  const topCampaigns = await knex("visit_details")
    .where("user_id", userId)
    .whereNotNull("utm_campaign")
    .select("utm_campaign")
    .count("* as visits")
    .groupBy("utm_campaign")
    .orderBy("visits", "desc")
    .limit(5);
  
  return res.send({
    overview: {
      total_links: parseInt(totalStats.total_links, 10),
      total_visits: parseInt(totalStats.total_visits, 10) || 0,
      visits_last_24h: parseInt(recentActivity.count, 10),
    },
    top_links: topLinks.map(link => ({
      uuid: link.uuid,
      address: link.address,
      target: link.target,
      visit_count: link.visit_count,
      created_at: link.created_at,
    })),
    top_campaigns: topCampaigns.map(c => ({
      name: c.utm_campaign,
      visits: parseInt(c.visits, 10),
    })),
  });
}

module.exports = {
  getVisitDetails,
  getTimeHeatmap,
  getUTMStats,
  getRealTimeStats,
  getConversionFunnel,
  getABTestStats,
  getDeviceStats,
  exportStats,
  getDashboard,
};
