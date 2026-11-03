import { NextResponse } from "next/server";
import { READING_EVENTS_KEY, trackEventSchema, type QueuedReadingEvent } from "@repo/analytics/events";
import { getRedis } from "@/lib/redis";

// ไม่เขียน DB ตรงๆ: push เข้า Redis แล้วให้ apps/worker รวมเป็น batch
// TODO: ใส่ rate limit ต่อ IP/session และผูก userId จาก session จริง
export async function POST(req: Request) {
  const parsed = trackEventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const event: QueuedReadingEvent = {
    ...parsed.data,
    userId: null,
    occurredAt: new Date().toISOString(),
  };
  await getRedis().rpush(READING_EVENTS_KEY, JSON.stringify(event));
  return new NextResponse(null, { status: 202 });
}
