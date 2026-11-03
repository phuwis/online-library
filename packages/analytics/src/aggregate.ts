import { Prisma, prisma } from "@repo/db";

/**
 * รวม ReadingEvent ในช่วง [from, to) เป็นตารางสรุปรายวัน
 * - re-run ได้ปลอดภัย (ON CONFLICT DO UPDATE → ค่าเดิมถูกแทนที่ด้วยค่าที่คำนวณใหม่ทั้งวัน)
 * - ควรส่งช่วงที่ align กับขอบเขตวัน (UTC) เสมอ
 */
export async function aggregateRange(from: Date, to: Date) {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "BookStatsDaily" ("bookId", "date", "sessions", "uniqueReaders", "totalSec", "finished")
    SELECT
      e."bookId",
      date_trunc('day', e."occurredAt")::date AS day,
      COUNT(DISTINCT e."sessionId")::int,
      COUNT(DISTINCT e."userId")::int,
      COALESCE(SUM(e."deltaSec"), 0)::bigint,
      (COUNT(DISTINCT e."sessionId") FILTER (WHERE e."type" = 'FINISH'))::int
    FROM "ReadingEvent" e
    JOIN "Book" b ON b."id" = e."bookId"
    WHERE e."occurredAt" >= ${from} AND e."occurredAt" < ${to}
    GROUP BY e."bookId", day
    ON CONFLICT ("bookId", "date") DO UPDATE SET
      "sessions"      = EXCLUDED."sessions",
      "uniqueReaders" = EXCLUDED."uniqueReaders",
      "totalSec"      = EXCLUDED."totalSec",
      "finished"      = EXCLUDED."finished"
  `);

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "SiteStatsDaily" ("date", "sessions", "uniqueReaders", "totalSec")
    SELECT
      date_trunc('day', e."occurredAt")::date AS day,
      COUNT(DISTINCT e."sessionId")::int,
      COUNT(DISTINCT e."userId")::int,
      COALESCE(SUM(e."deltaSec"), 0)::bigint
    FROM "ReadingEvent" e
    WHERE e."occurredAt" >= ${from} AND e."occurredAt" < ${to}
    GROUP BY day
    ON CONFLICT ("date") DO UPDATE SET
      "sessions"      = EXCLUDED."sessions",
      "uniqueReaders" = EXCLUDED."uniqueReaders",
      "totalSec"      = EXCLUDED."totalSec"
  `);
}

export function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** คำนวณใหม่ของ "เมื่อวาน + วันนี้" (เผื่อ event มาช้าข้ามเที่ยงคืน) */
export async function aggregateRecent(now = new Date()) {
  const today = startOfUtcDay(now);
  const from = new Date(today.getTime() - 24 * 3600 * 1000);
  const to = new Date(today.getTime() + 24 * 3600 * 1000);
  await aggregateRange(from, to);
}
