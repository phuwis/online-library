import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import {
  READING_EVENTS_KEY,
  trackEventSchema,
  type QueuedReadingEvent,
} from "@repo/analytics/events";
import { getRedis, hasRedis } from "@/lib/redis";

/**
 * รับ event การอ่านจาก reader
 * - มี REDIS_URL (+ รัน apps/worker): push เข้า Redis แล้ว worker รวมเป็น batch ลง DB
 * - ไม่มี Redis หรือ Redis ล่ม: เขียนลง ReadingEvent ตรง ๆ (ปริมาณของห้องสมุดนี้รับได้สบาย)
 * TODO: ใส่ rate limit ต่อ IP/session และผูก userId จาก session จริง
 */
export async function POST(req: Request) {
  // sendBeacon ส่งเป็น Blob → อ่านเป็น text แล้ว parse เอง
  const raw = await req.text().catch(() => "");
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    // ปล่อยให้ schema ตอบ 400
  }
  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const event: QueuedReadingEvent = {
    ...parsed.data,
    userId: null,
    occurredAt: new Date().toISOString(),
  };

  if (hasRedis()) {
    try {
      await getRedis().rpush(READING_EVENTS_KEY, JSON.stringify(event));
      return new NextResponse(null, { status: 202 });
    } catch (err) {
      console.warn(
        "[track] redis unavailable, writing to DB directly:",
        (err as Error).message,
      );
    }
  }

  try {
    await prisma.readingEvent.create({
      data: {
        occurredAt: new Date(event.occurredAt),
        bookId: event.bookId,
        userId: event.userId,
        visitorId: event.visitorId ?? null,
        sessionId: event.sessionId,
        type: event.type,
        percent: event.percent,
        deltaSec: event.deltaSec,
      },
    });
    return new NextResponse(null, { status: 202 });
  } catch (err) {
    console.error("[track] insert failed:", err);
    return NextResponse.json({ error: "track failed" }, { status: 500 });
  }
}
