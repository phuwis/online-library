import type { Redis } from "ioredis";
import { prisma } from "@repo/db";
import {
  READING_EVENTS_FAILED_KEY,
  READING_EVENTS_KEY,
  type QueuedReadingEvent,
} from "@repo/analytics/events";

const BATCH_SIZE = 500;
const IDLE_MS = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** ดึง event จาก Redis ทีละ batch แล้ว createMany เข้า DB */
export async function drainEvents(redis: Redis, shouldStop: () => boolean) {
  while (!shouldStop()) {
    const raw = await redis.lpop(READING_EVENTS_KEY, BATCH_SIZE);
    if (!raw || raw.length === 0) {
      await sleep(IDLE_MS);
      continue;
    }

    const rows = [];
    for (const item of raw) {
      try {
        const e = JSON.parse(item) as QueuedReadingEvent;
        rows.push({
          occurredAt: new Date(e.occurredAt),
          bookId: e.bookId,
          userId: e.userId,
          sessionId: e.sessionId,
          type: e.type,
          percent: e.percent,
          deltaSec: e.deltaSec,
        });
      } catch {
        await redis.rpush(READING_EVENTS_FAILED_KEY, item);
      }
    }

    try {
      if (rows.length) await prisma.readingEvent.createMany({ data: rows });
    } catch (err) {
      console.error("[drain] insert failed, moving batch to failed list", err);
      await redis.rpush(READING_EVENTS_FAILED_KEY, ...raw);
      await sleep(IDLE_MS);
    }
  }
}
