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
      maxStalledCount: 1,
      lockDuration: 30000,
      lockRenewTime: 15000
    },
    limiter: {
      max: 100,
      duration: 1000
    }
  });
  
  // Clean up old jobs
  visit.clean(5000, "completed");
  visit.clean(10000, "failed");
  
  // Process visits with increased concurrency
  visit.process(12, path.resolve(__dirname, "visit.js"));
  
  // Remove completed jobs immediately to free memory
  visit.on("completed", job => {
    job.remove().catch(err => console.error("Failed to remove job:", err));
  });
  
  // Handle errors properly
  visit.on("error", function (error) {
    console.error("Visit queue error:", error);
  });
  
  visit.on("failed", function (job, error) {
    console.error("Visit job failed:", job.id, error.message);
    // Remove failed jobs after logging to prevent accumulation
    job.remove().catch(err => console.error("Failed to remove failed job:", err));
  });
  
  // Monitor queue health
  visit.on("stalled", function (job) {
    console.warn("Visit job stalled:", job.id);
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