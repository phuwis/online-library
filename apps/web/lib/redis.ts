import IORedis from "ioredis";

const g = globalThis as unknown as { redis?: IORedis };

/** มี Redis ให้ใช้ไหม (ไม่มี = ไม่มี worker → เว็บเขียน DB และ aggregate เอง) */
export function hasRedis() {
  return Boolean(process.env.REDIS_URL);
}

export function getRedis() {
  if (!g.redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    g.redis = new IORedis(url, {
      // Redis ล่ม → คำสั่ง error เร็ว ๆ (route จะ fallback ไปเขียน DB) แทนการค้างรอนาน
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    g.redis.on("error", (err) => {
      console.warn("[redis]", err.message);
    });
  }
  return g.redis;
}
