const Queue = require("bull");
const path = require("node:path");

const env = require("../env");

const redis = {
  port: env.REDIS_PORT,
  host: env.REDIS_HOST,
  db: env.REDIS_DB,
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD })
};

let visit;

if (env.REDIS_ENABLED) {
  visit = new Queue("visit", { 
    redis,
    settings: {
      maxStalledCount: 1, // Only retry stalled jobs once
      lockDuration: 60000, // 60 seconds lock (increased from 30s)
      lockRenewTime: 30000, // Renew lock every 30s
      stalledInterval: 30000, // Check for stalled jobs every 30s
    },
    limiter: {
      max: 100, // Max 100 jobs per duration
      duration: 1000, // Per 1 second
    }
  });
  
  // Wait for queue to be ready before cleaning
  visit.on("ready", async () => {
    try {
      console.log("[Visit Queue] Queue ready, cleaning up old jobs...");
      
      // Clean completed and failed jobs
      await visit.clean(0, "completed");
      await visit.clean(0, "failed");
      
      // Clean all stalled jobs on startup
      const stalled = await visit.getStalled();
      if (stalled.length > 0) {
        console.log(`[Visit Queue] Found ${stalled.length} stalled jobs, cleaning...`);
        for (const job of stalled) {
          await job.moveToFailed({ message: 'Stalled on startup' }, true);
        }
        // Clean failed again after moving stalled jobs
        await visit.clean(0, "failed");
      }
      
      console.log("[Visit Queue] Cleanup complete");
    } catch (error) {
      console.error("[Visit Queue] Cleanup error:", error.message);
    }
  });
  
  // Regular cleanup every minute
  setInterval(() => {
    visit.clean(5000, "completed").catch(err => console.error("[Visit Queue] Failed to clean completed:", err.message));
    visit.clean(10000, "failed").catch(err => console.error("[Visit Queue] Failed to clean failed:", err.message));
  }, 60000);
  
  // Process visits with concurrency
  visit.process(12, path.resolve(__dirname, "visit.js"));
  
  // Remove completed jobs immediately to free memory
  visit.on("completed", job => {
    job.remove().catch(err => console.error("Failed to remove job:", err));
  });
  
  // Handle errors properly
  visit.on("error", function (error) {
    console.error("[Visit Queue] Error:", error);
  });
  
  visit.on("failed", function (job, error) {
    console.error("[Visit Queue] Job failed:", job.id, error.message);
    // Remove failed jobs after logging
    job.remove().catch(err => console.error("Failed to remove failed job:", err));
  });
  
  // Monitor stalled jobs (should be rare now)
  visit.on("stalled", function (job) {
    console.warn("[Visit Queue] Job stalled:", job.id, "- will be retried once");
  });
} else {
  const visitProcessor = require(path.resolve(__dirname, "visit.js"));
  
  // Track in-flight requests to prevent memory buildup
  let pendingVisits = 0;
  const MAX_PENDING = 100;
  
  visit = {
    add(data) {
      // Drop visits if queue is too full (backpressure)
      if (pendingVisits >= MAX_PENDING) {
        console.warn("Visit queue full, dropping visit");
        return Promise.resolve();
      }
      
      pendingVisits++;
      return visitProcessor({ data })
        .catch(function(error) {
          console.error("Add visit error:", error);
        })
        .finally(() => {
          pendingVisits--;
        });
    }
  }
}



module.exports = { 
  visit,
}