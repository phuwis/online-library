import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import { prisma } from "@repo/db";
import { aggregateRecent } from "@repo/analytics/aggregate";
import { drainEvents } from "./jobs/drain-events";
import { ensureReadingEventPartitions } from "./jobs/ensure-partitions";

const url = process.env.REDIS_URL;
if (!url) throw new Error("REDIS_URL is required");

// BullMQ ต้องการ maxRetriesPerRequest: null
const bullConnection = new IORedis(url, { maxRetriesPerRequest: null });
const redis = new IORedis(url);

let stopping = false;

async function main() {
  await ensureReadingEventPartitions();

  // งานตามเวลา: aggregate ทุก 10 นาที, สร้าง partition ทุกวัน
  const queue = new Queue("maintenance", { connection: bullConnection });
  await queue.upsertJobScheduler("aggregate-recent", { pattern: "*/10 * * * *" }, { name: "aggregate-recent" });
  await queue.upsertJobScheduler("ensure-partitions", { pattern: "0 2 * * *" }, { name: "ensure-partitions" });

  const worker = new Worker(
    "maintenance",
    async (job) => {
      if (job.name === "aggregate-recent") await aggregateRecent();
      if (job.name === "ensure-partitions") await ensureReadingEventPartitions();
    },
    { connection: bullConnection },
  );
  worker.on("failed", (job, err) => console.error(`[job ${job?.name}] failed`, err));

  const shutdown = async () => {
    stopping = true;
    await worker.close();
    await queue.close();
    redis.disconnect();
    bullConnection.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("[worker] started");
  await drainEvents(redis, () => stopping);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
