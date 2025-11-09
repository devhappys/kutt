const useragent = require("useragent");
const geoip = require("geoip-lite");
const URL = require("node:url");

const { removeWww } = require("../utils");
const query = require("../queries");

const browsersList = ["IE", "Firefox", "Chrome", "Opera", "Safari", "Edge"];
const osList = ["Windows", "Mac OS", "Linux", "Android", "iOS"];

function filterInBrowser(agent) {
  return function(item) {
    return agent.family.toLowerCase().includes(item.toLocaleLowerCase());
  }
}

function filterInOs(agent) {
  return function(item) {
    return agent.os.family.toLowerCase().includes(item.toLocaleLowerCase());
  }
}

module.exports = async function({ data }) {
  try {
    // Increment visit count first (lighter operation)
    await query.link.incrementVisit({ id: data.link.id });
    
    // Parse user agent
    const userAgent = data.userAgent || data.headers?.["user-agent"];
    if (!userAgent) {
      console.warn("No user agent provided for visit");
      return;
    }
    
    const agent = useragent.parse(userAgent);
    const [browser = "Other"] = browsersList.filter(filterInBrowser(agent));
    const [os = "Other"] = osList.filter(filterInOs(agent));
    
    // Parse referrer safely
    let referrer = "Direct";
    if (data.referrer) {
      try {
        const parsed = URL.parse(data.referrer);
        if (parsed.hostname) {
          referrer = removeWww(parsed.hostname).replace(/\./gi, "[dot]");
        }
      } catch (err) {
        console.warn("Failed to parse referrer:", data.referrer);
      }
    }
    
    // Get country
    const country = data.country || geoip.lookup(data.ip)?.country || "Unknown";
    
    // Add detailed visit stats
    await query.visit.add({
      browser: browser.toLowerCase(),
      country: country,
      link_id: data.link.id,
      user_id: data.link.user_id,
      os: os.toLowerCase().replace(/\s/gi, ""),
      referrer: referrer
    });
  } catch (error) {
    console.error("Visit processing error:", error);
    throw error;
  }
}