import IORedis from "ioredis";

const g = globalThis as unknown as { redis?: IORedis };

export function getRedis() {
  if (!g.redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    g.redis = new IORedis(url, { lazyConnect: false, maxRetriesPerRequest: 2 });
  }
  return g.redis;
}
