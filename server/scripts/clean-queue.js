#!/usr/bin/env node

/**
 * Clean Redis queue manually
 * Usage: node server/scripts/clean-queue.js
 */

require("dotenv").config();
const Queue = require("bull");
const env = require("../env");

const redis = {
  port: env.REDIS_PORT,
  host: env.REDIS_HOST,
  db: env.REDIS_DB,
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD })
};

async function cleanQueue() {
  if (!env.REDIS_ENABLED) {
    console.log("❌ Redis is not enabled. Set REDIS_ENABLED=true in .env");
    process.exit(1);
  }

  console.log("🔧 Connecting to Redis queue...");
  const visit = new Queue("visit", { redis });

  try {
    // Get queue stats
    const counts = await visit.getJobCounts();
    console.log("\n📊 Current queue stats:");
    console.log(`   Waiting: ${counts.waiting}`);
    console.log(`   Active: ${counts.active}`);
    console.log(`   Completed: ${counts.completed}`);
    console.log(`   Failed: ${counts.failed}`);
    console.log(`   Delayed: ${counts.delayed}`);
    
    // Get stalled jobs
    const stalled = await visit.getStalled();
    console.log(`   Stalled: ${stalled.length}`);

    console.log("\n🧹 Cleaning queue...");

    // Clean completed jobs
    const cleaned1 = await visit.clean(0, "completed");
    console.log(`   ✓ Removed ${cleaned1.length} completed jobs`);

    // Clean failed jobs
    const cleaned2 = await visit.clean(0, "failed");
    console.log(`   ✓ Removed ${cleaned2.length} failed jobs`);

    // Handle stalled jobs
    if (stalled.length > 0) {
      console.log(`\n⚠️  Found ${stalled.length} stalled jobs, moving to failed...`);
      for (const job of stalled) {
        await job.moveToFailed({ message: 'Manually cleaned' }, true);
      }
      
      // Clean failed again
      const cleaned3 = await visit.clean(0, "failed");
      console.log(`   ✓ Removed ${cleaned3.length} failed (including stalled) jobs`);
    }

    // Get final stats
    const finalCounts = await visit.getJobCounts();
    console.log("\n✅ Final queue stats:");
    console.log(`   Waiting: ${finalCounts.waiting}`);
    console.log(`   Active: ${finalCounts.active}`);
    console.log(`   Completed: ${finalCounts.completed}`);
    console.log(`   Failed: ${finalCounts.failed}`);
    console.log(`   Delayed: ${finalCounts.delayed}`);

    console.log("\n✨ Queue cleaned successfully!");

    await visit.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error cleaning queue:", error);
    await visit.close();
    process.exit(1);
  }
}

cleanQueue();
