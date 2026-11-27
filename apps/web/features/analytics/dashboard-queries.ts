import { Prisma } from "@repo/db";
import { DDC_CLASSES } from "@/features/books/filters";
import type {
  AreaTraffic,
  CategoryStat,
  DashboardData,
  SiteTotals,
  DeviceKey,
  ReadingSummary,
  SeriesPoint,
} from "./dashboard-types";
import {
  bucketKeys,
  thaiToday,
  thaiMidnightUtc,
  addDays,
  type Granularity,
  type ResolvedRange,
} from "./range";

/**
 * Query ทั้งหมดของ dashboard (อ่านจากตาราง event ดิบ + index ตามเวลา)
 * - รับ runner เข้ามา เพื่อให้ทดสอบกับ Postgres จริงได้โดยไม่ต้องมี Prisma engine
 * - เวลาไทย = occurredAt (UTC) + 7 ชั่วโมง
 * ถ้าข้อมูลโตระดับหลายล้านแถว/เดือน ค่อยย้ายไปอ่านจากตาราง aggregate
 */
export type SqlRunner = (query: Prisma.Sql) => Promise<unknown[]>;

type Bounds = { a: Prisma.Sql; b: Prisma.Sql };

const ts = (d: Date) => Prisma.sql`${d.toISOString()}::timestamp`;
const LOCAL = Prisma.raw(`("occurredAt" + interval '7 hours')`);
const E_LOCAL = Prisma.raw(`(e."occurredAt" + interval '7 hours')`);

function bounds(from: string, to: string): Bounds {
  return {
    a: ts(thaiMidnightUtc(from)),
    b: ts(thaiMidnightUtc(addDays(to, 1))),
  };
}

function bucketExpr(g: Granularity, col: Prisma.Sql) {
  const unit = Prisma.raw(`'${g}'`); // g ผ่าน whitelist แล้ว
  const fmt = Prisma.raw(g === "hour" ? `'YYYY-MM-DD"T"HH24'` : `'YYYY-MM-DD'`);
  return Prisma.sql`to_char(date_trunc(${unit}, ${col}), ${fmt})`;
}

/** 1 แถวต่อ 1 ครั้งที่อ่าน (session) */
function readingSessionsCte({ a, b }: Bounds) {
  return Prisma.sql`
    s AS (
      SELECT e."bookId", e."sessionId",
        MIN(e."visitorId") AS "visitorId",
        COALESCE(SUM(e."deltaSec"), 0) AS sec,
        MAX(e."percent") AS mp,
        bool_or(e."type" = 'FINISH') AS fin,
        bool_or(e."deltaSec" > 0 OR e."type" = 'FINISH') AS counted
      FROM "ReadingEvent" e
      WHERE e."occurredAt" >= ${a} AND e."occurredAt" < ${b}
      GROUP BY e."bookId", e."sessionId"
    )`;
}

const num = (v: unknown) => (v == null ? 0 : Number(v));

// ───────────── การเข้าชม ─────────────

async function trafficSummary(run: SqlRunner, { a, b }: Bounds) {
  const rows = (await run(Prisma.sql`
    SELECT area::text AS area,
      COALESCE(SUM(pv), 0)::int AS pageviews,
      COUNT(*)::int AS sessions,
      COUNT(DISTINCT "visitorId")::int AS visitors,
      (COUNT(*) FILTER (WHERE pv = 1))::int AS bounces
    FROM (
      SELECT area, "sessionId", MIN("visitorId") AS "visitorId", COUNT(*) AS pv
      FROM "PageView"
      WHERE "occurredAt" >= ${a} AND "occurredAt" < ${b}
      GROUP BY area, "sessionId"
    ) x
    GROUP BY area
  `)) as Array<Record<string, unknown>>;

  const empty = (): AreaTraffic => ({
    pageviews: 0,
    sessions: 0,
    visitors: 0,
    bounces: 0,
  });
  const out = { public: empty(), admin: empty() };
  for (const r of rows) {
    const t: AreaTraffic = {
      pageviews: num(r.pageviews),
      sessions: num(r.sessions),
      visitors: num(r.visitors),
      bounces: num(r.bounces),
    };
    if (r.area === "PUBLIC") out.public = t;
    if (r.area === "ADMIN") out.admin = t;
  }
  return out;
}

async function newVsReturning(run: SqlRunner, { a, b }: Bounds) {
  const [r] = (await run(Prisma.sql`
    SELECT (COUNT(*) FILTER (WHERE f.first_seen >= ${a}))::int AS new_visitors,
      COUNT(*)::int AS visitors
    FROM (
      SELECT v."visitorId",
        (SELECT MIN(p."occurredAt") FROM "PageView" p
          WHERE p."visitorId" = v."visitorId" AND p.area = 'PUBLIC') AS first_seen
      FROM (
        SELECT DISTINCT "visitorId" FROM "PageView"
        WHERE area = 'PUBLIC' AND "occurredAt" >= ${a} AND "occurredAt" < ${b}
      ) v
    ) f
  `)) as Array<Record<string, unknown>>;
  const visitors = num(r?.visitors);
  const fresh = num(r?.new_visitors);
  return { newVisitors: fresh, returningVisitors: visitors - fresh };
}

async function trafficSeries(run: SqlRunner, bnd: Bounds, g: Granularity) {
  return (await run(Prisma.sql`
    SELECT ${bucketExpr(g, LOCAL)} AS key, area::text AS area,
      COUNT(*)::int AS pageviews,
      COUNT(DISTINCT "visitorId")::int AS visitors,
      COUNT(DISTINCT "sessionId")::int AS sessions
    FROM "PageView"
    WHERE "occurredAt" >= ${bnd.a} AND "occurredAt" < ${bnd.b}
    GROUP BY 1, 2
  `)) as Array<{
    key: string;
    area: string;
    pageviews: number;
    visitors: number;
    sessions: number;
  }>;
}

async function readingSeries(run: SqlRunner, bnd: Bounds, g: Granularity) {
  return (await run(Prisma.sql`
    SELECT ${bucketExpr(g, E_LOCAL)} AS key,
      (COUNT(DISTINCT e."sessionId") FILTER (WHERE e."deltaSec" > 0 OR e."type" = 'FINISH'))::int AS sessions,
      COALESCE(SUM(e."deltaSec"), 0)::float8 AS seconds,
      (COUNT(DISTINCT e."visitorId") FILTER (WHERE e."deltaSec" > 0 OR e."type" = 'FINISH'))::int AS readers
    FROM "ReadingEvent" e
    JOIN "Book" bk ON bk."id" = e."bookId"
    WHERE e."occurredAt" >= ${bnd.a} AND e."occurredAt" < ${bnd.b}
    GROUP BY 1
  `)) as Array<{
    key: string;
    sessions: number;
    seconds: number;
    readers: number;
  }>;
}

async function buildSeries(
  run: SqlRunner,
  from: string,
  to: string,
  g: Granularity,
): Promise<SeriesPoint[]> {
  const bnd = bounds(from, to);
  const [traffic, reading] = await Promise.all([
    trafficSeries(run, bnd, g),
    readingSeries(run, bnd, g),
  ]);
  const map = new Map<string, SeriesPoint>(
    bucketKeys(from, to, g).map((key) => [
      key,
      {
        key,
        visitors: 0,
        pageviews: 0,
        sessions: 0,
        adminSessions: 0,
        adminPageviews: 0,
        readingSessions: 0,
        readingSec: 0,
        readers: 0,
      },
    ]),
  );
  for (const r of traffic) {
    const p = map.get(r.key);
    if (!p) continue;
    if (r.area === "PUBLIC") {
      p.visitors = num(r.visitors);
      p.pageviews = num(r.pageviews);
      p.sessions = num(r.sessions);
    } else {
      p.adminSessions = num(r.sessions);
      p.adminPageviews = num(r.pageviews);
    }
  }
  for (const r of reading) {
    const p = map.get(r.key);
    if (!p) continue;
    p.readingSessions = num(r.sessions);
    p.readingSec = num(r.seconds);
    p.readers = num(r.readers);
  }
  return [...map.values()];
}

async function heatmaps(run: SqlRunner, { a, b }: Bounds) {
  const [views, reading] = await Promise.all([
    run(Prisma.sql`
      SELECT EXTRACT(ISODOW FROM ${LOCAL})::int AS dow, EXTRACT(HOUR FROM ${LOCAL})::int AS hour,
        COUNT(*)::int AS value
      FROM "PageView"
      WHERE area = 'PUBLIC' AND "occurredAt" >= ${a} AND "occurredAt" < ${b}
      GROUP BY 1, 2
    `),
    run(Prisma.sql`
      SELECT EXTRACT(ISODOW FROM ${E_LOCAL})::int AS dow, EXTRACT(HOUR FROM ${E_LOCAL})::int AS hour,
        COALESCE(SUM(e."deltaSec"), 0)::float8 AS value
      FROM "ReadingEvent" e
      JOIN "Book" bk ON bk."id" = e."bookId"
      WHERE e."occurredAt" >= ${a} AND e."occurredAt" < ${b}
      GROUP BY 1, 2
    `),
  ]);
  const grid = (rows: unknown[]) => {
    const g = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    for (const r of rows as Array<{
      dow: number;
      hour: number;
      value: number;
    }>) {
      g[num(r.dow) - 1]![num(r.hour)] = num(r.value);
    }
    return g;
  };
  return { pageviews: grid(views), readingSec: grid(reading) };
}

const STATIC_PAGES: Record<string, string> = {
  "/": "หน้าแรก",
  "/books": "หนังสือทั้งหมด",
  "/about": "เกี่ยวกับเรา",
};

async function topPages(run: SqlRunner, { a, b }: Bounds) {
  const rows = (await run(Prisma.sql`
    SELECT path, COUNT(*)::int AS pageviews, COUNT(DISTINCT "visitorId")::int AS visitors
    FROM "PageView"
    WHERE area = 'PUBLIC' AND "occurredAt" >= ${a} AND "occurredAt" < ${b}
    GROUP BY path
    ORDER BY pageviews DESC, path
    LIMIT 10
  `)) as Array<{ path: string; pageviews: number; visitors: number }>;

  const slugs = [
    ...new Set(
      rows
        .map((r) => /^\/(?:books|read)\/([^/]+)$/.exec(r.path)?.[1])
        .filter((s): s is string => Boolean(s)),
    ),
  ];
  const titles = new Map<string, string>();
  if (slugs.length) {
    const books = (await run(
      Prisma.sql`SELECT slug, title FROM "Book" WHERE slug = ANY(${slugs}::text[])`,
    )) as Array<{ slug: string; title: string }>;
    for (const bk of books) titles.set(bk.slug, bk.title);
  }

  return rows.map((r) => {
    const m = /^\/(books|read)\/([^/]+)$/.exec(r.path);
    const title = m ? titles.get(m[2]!) : undefined;
    const label =
      STATIC_PAGES[r.path] ??
      (m
        ? `${m[1] === "read" ? "อ่าน" : "รายละเอียด"}: ${title ?? m[2]}`
        : r.path);
    return {
      path: r.path,
      label,
      pageviews: num(r.pageviews),
      visitors: num(r.visitors),
    };
  });
}

async function topBookPages(run: SqlRunner, { a, b }: Bounds) {
  const rows = (await run(Prisma.sql`
    SELECT bk.slug, bk.title, COUNT(*)::int AS pageviews, COUNT(DISTINCT p."visitorId")::int AS visitors
    FROM "PageView" p
    JOIN "Book" bk ON bk.slug = substring(p.path from 8)
    WHERE p.area = 'PUBLIC' AND p.path LIKE '/books/%'
      AND p."occurredAt" >= ${a} AND p."occurredAt" < ${b}
    GROUP BY bk.slug, bk.title
    ORDER BY pageviews DESC, bk.title
    LIMIT 10
  `)) as Array<{
    slug: string;
    title: string;
    pageviews: number;
    visitors: number;
  }>;
  return rows.map((r) => ({
    ...r,
    pageviews: num(r.pageviews),
    visitors: num(r.visitors),
  }));
}

async function devices(run: SqlRunner, { a, b }: Bounds) {
  const rows = (await run(Prisma.sql`
    SELECT area::text AS area, device::text AS device,
      COUNT(DISTINCT "visitorId")::int AS visitors, COUNT(*)::int AS pageviews
    FROM "PageView"
    WHERE "occurredAt" >= ${a} AND "occurredAt" < ${b}
    GROUP BY 1, 2
  `)) as Array<{
    area: string;
    device: DeviceKey;
    visitors: number;
    pageviews: number;
  }>;
  const blank = () => ({
    MOBILE: { visitors: 0, pageviews: 0 },
    TABLET: { visitors: 0, pageviews: 0 },
    DESKTOP: { visitors: 0, pageviews: 0 },
  });
  const out = { public: blank(), admin: blank() };
  for (const r of rows) {
    const side = r.area === "ADMIN" ? out.admin : out.public;
    if (side[r.device])
      side[r.device] = {
        visitors: num(r.visitors),
        pageviews: num(r.pageviews),
      };
  }
  return out;
}

export function sourceLabel(host: string): string {
  if (!host) return "เข้าตรง / ไม่ทราบที่มา";
  if (/(^|\.)google\./.test(host)) return "Google";
  if (/(^|\.)bing\.com$/.test(host)) return "Bing";
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return "Facebook";
  if (/(^|\.)(line\.me|line\.naver\.jp|liff\.line\.me)$/.test(host))
    return "LINE";
  if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(host)) return "X (Twitter)";
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return "YouTube";
  if (/(^|\.)tiktok\.com$/.test(host)) return "TikTok";
  return host;
}

async function sources(run: SqlRunner, { a, b }: Bounds) {
  const rows = (await run(Prisma.sql`
    SELECT COALESCE(src, '') AS source, COUNT(*)::int AS sessions
    FROM (
      SELECT "sessionId", MAX(referrer) AS src
      FROM "PageView"
      WHERE area = 'PUBLIC' AND "occurredAt" >= ${a} AND "occurredAt" < ${b}
      GROUP BY "sessionId"
    ) s
    GROUP BY 1
  `)) as Array<{ source: string; sessions: number }>;
  const grouped = new Map<
    string,
    { source: string; label: string; sessions: number }
  >();
  for (const r of rows) {
    const label = sourceLabel(r.source);
    const cur = grouped.get(label) ?? { source: r.source, label, sessions: 0 };
    cur.sessions += num(r.sessions);
    grouped.set(label, cur);
  }
  return [...grouped.values()]
    .sort((x, y) => y.sessions - x.sessions)
    .slice(0, 8);
}

// ───────────── การอ่าน ─────────────

async function readingSummary(
  run: SqlRunner,
  bnd: Bounds,
): Promise<ReadingSummary> {
  const [r] = (await run(Prisma.sql`
    WITH ${readingSessionsCte(bnd)}
    SELECT (COUNT(*) FILTER (WHERE s.counted))::int AS sessions,
      (COUNT(DISTINCT s."visitorId") FILTER (WHERE s.counted))::int AS readers,
      COALESCE(SUM(s.sec), 0)::float8 AS total_sec,
      (COUNT(*) FILTER (WHERE s.fin))::int AS finishes,
      (COUNT(DISTINCT s."bookId") FILTER (WHERE s.counted))::int AS books_read,
      COALESCE(AVG(s.mp) FILTER (WHERE s.counted), 0)::float8 AS avg_percent
    FROM s JOIN "Book" bk ON bk."id" = s."bookId"
  `)) as Array<Record<string, unknown>>;
  return {
    sessions: num(r?.sessions),
    readers: num(r?.readers),
    totalSec: num(r?.total_sec),
    finishes: num(r?.finishes),
    booksRead: num(r?.books_read),
    avgPercent: num(r?.avg_percent),
  };
}

async function topBooks(run: SqlRunner, bnd: Bounds) {
  const rows = (await run(Prisma.sql`
    WITH ${readingSessionsCte(bnd)}
    SELECT bk."id", bk.slug, bk.title, bk.author, bk.ddc::text AS ddc,
      (COUNT(*) FILTER (WHERE s.counted))::int AS sessions,
      (COUNT(DISTINCT s."visitorId") FILTER (WHERE s.counted))::int AS readers,
      COALESCE(SUM(s.sec), 0)::float8 AS total_sec,
      (COUNT(*) FILTER (WHERE s.fin))::int AS finishes,
      COALESCE(AVG(s.mp) FILTER (WHERE s.counted), 0)::float8 AS avg_percent
    FROM s JOIN "Book" bk ON bk."id" = s."bookId"
    GROUP BY bk."id"
    HAVING COUNT(*) FILTER (WHERE s.counted) > 0
    ORDER BY sessions DESC, total_sec DESC
    LIMIT 10
  `)) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    author: String(r.author ?? ""),
    ddc: String(r.ddc),
    sessions: num(r.sessions),
    readers: num(r.readers),
    totalSec: num(r.total_sec),
    finishes: num(r.finishes),
    avgPercent: num(r.avg_percent),
  }));
}

async function readingByDdc(run: SqlRunner, bnd: Bounds) {
  const rows = (await run(Prisma.sql`
    WITH ${readingSessionsCte(bnd)}
    SELECT bk.ddc::text AS ddc,
      (COUNT(*) FILTER (WHERE s.counted))::int AS sessions,
      COALESCE(SUM(s.sec), 0)::float8 AS total_sec,
      (COUNT(DISTINCT s."bookId") FILTER (WHERE s.counted))::int AS books
    FROM s JOIN "Book" bk ON bk."id" = s."bookId"
    GROUP BY 1
  `)) as Array<{
    ddc: string;
    sessions: number;
    total_sec: number;
    books: number;
  }>;
  const byKey = new Map(rows.map((r) => [r.ddc, r]));
  return DDC_CLASSES.map((d) => {
    const r = byKey.get(d.value);
    return {
      ddc: d.value,
      code: d.code,
      label: d.label,
      sessions: num(r?.sessions),
      totalSec: num(r?.total_sec),
      books: num(r?.books),
    };
  });
}

async function catalog(run: SqlRunner, { a, b }: Bounds) {
  const [r] = (await run(Prisma.sql`
    SELECT
      (COUNT(*) FILTER (WHERE bk.status = 'PUBLISHED'))::int AS published,
      (COUNT(*) FILTER (WHERE bk."createdAt" >= ${a} AND bk."createdAt" < ${b}))::int AS added,
      (COUNT(*) FILTER (
        WHERE bk.status = 'PUBLISHED' AND NOT EXISTS (
          SELECT 1 FROM "ReadingEvent" e
          WHERE e."bookId" = bk."id" AND e."occurredAt" >= ${a} AND e."occurredAt" < ${b}
            AND (e."deltaSec" > 0 OR e."type" = 'FINISH')
        )
      ))::int AS unread
    FROM "Book" bk
  `)) as Array<Record<string, unknown>>;
  return {
    published: num(r?.published),
    addedInRange: num(r?.added),
    unreadPublished: num(r?.unread),
  };
}

// ───────────── หลังบ้าน ─────────────

const ADMIN_SECTION_LABELS: Record<string, string> = {
  overview: "ภาพรวมและสถิติ",
  books: "จัดการหนังสือ",
  categories: "จัดการหมวดหมู่",
  login: "หน้าเข้าสู่ระบบ",
  other: "หน้าอื่น ๆ",
};

async function adminSections(run: SqlRunner, { a, b }: Bounds) {
  const rows = (await run(Prisma.sql`
    SELECT CASE
        WHEN path = '/dashboard' THEN 'overview'
        WHEN path LIKE '/dashboard/books%' THEN 'books'
        WHEN path LIKE '/dashboard/categories%' THEN 'categories'
        WHEN path LIKE '/login%' THEN 'login'
        ELSE 'other'
      END AS section,
      COUNT(*)::int AS pageviews,
      COUNT(DISTINCT "sessionId")::int AS sessions
    FROM "PageView"
    WHERE area = 'ADMIN' AND "occurredAt" >= ${a} AND "occurredAt" < ${b}
    GROUP BY 1
    ORDER BY pageviews DESC
  `)) as Array<{ section: string; pageviews: number; sessions: number }>;
  return rows.map((r) => ({
    section: r.section,
    label: ADMIN_SECTION_LABELS[r.section] ?? r.section,
    pageviews: num(r.pageviews),
    sessions: num(r.sessions),
  }));
}

// ───────────── ยอดสะสมของเว็บไซต์ (หน้าบ้าน) ─────────────

/** จำนวนเครื่อง / จำนวนครั้งที่เข้า (รวมเข้าซ้ำ) ทั้งหมด และของปีนี้ (ปีปฏิทิน เวลาไทย) */
export async function siteTotals(
  run: SqlRunner,
  now = new Date(),
): Promise<SiteTotals> {
  const today = thaiToday(now);
  const yearStart = ts(thaiMidnightUtc(`${today.slice(0, 4)}-01-01`));
  const [r] = (await run(Prisma.sql`
    SELECT
      COUNT(DISTINCT "visitorId")::int AS visitors,
      COUNT(DISTINCT "sessionId")::int AS visits,
      COUNT(*)::int AS pageviews,
      (COUNT(DISTINCT "visitorId") FILTER (WHERE "occurredAt" >= ${yearStart}))::int AS year_visitors,
      (COUNT(DISTINCT "sessionId") FILTER (WHERE "occurredAt" >= ${yearStart}))::int AS year_visits,
      (COUNT(*) FILTER (WHERE "occurredAt" >= ${yearStart}))::int AS year_pageviews,
      to_char(MIN("occurredAt") + interval '7 hours', 'YYYY-MM-DD') AS since
    FROM "PageView"
    WHERE area = 'PUBLIC'
  `)) as Array<Record<string, unknown>>;
  return {
    allTime: {
      visitors: num(r?.visitors),
      visits: num(r?.visits),
      pageviews: num(r?.pageviews),
    },
    thisYear: {
      visitors: num(r?.year_visitors),
      visits: num(r?.year_visits),
      pageviews: num(r?.year_pageviews),
      yearBE: Number(today.slice(0, 4)) + 543,
    },
    since: (r?.since as string | null) ?? null,
  };
}

// ───────────── หมวดหมู่ของห้องสมุด (ตาราง Category) ─────────────

/**
 * การเข้าดูหมวดหมู่ = เปิดรายการหนังสือของหมวด (/books?category=slug)
 *                   หรือเปิดหน้ารายละเอียด/หน้าอ่านของหนังสือที่อยู่ในหมวด
 * หนังสือ 1 เล่มอยู่ได้หลายหมวด → นับให้ทุกหมวดที่เล่มนั้นอยู่
 */
async function categoryStats(run: SqlRunner, { a, b }: Bounds) {
  return (await run(Prisma.sql`
    WITH touches AS (
      SELECT p."categoryId" AS cid, p."visitorId", p."sessionId", 'list' AS kind
      FROM "PageView" p
      WHERE p.area = 'PUBLIC' AND p."categoryId" IS NOT NULL
        AND p."occurredAt" >= ${a} AND p."occurredAt" < ${b}
      UNION ALL
      SELECT bc."categoryId", p."visitorId", p."sessionId", 'book'
      FROM "PageView" p
      JOIN "Book" bk ON bk.slug = split_part(p.path, '/', 3)
      JOIN "BookCategory" bc ON bc."bookId" = bk."id"
      WHERE p.area = 'PUBLIC' AND (p.path LIKE '/books/%' OR p.path LIKE '/read/%')
        AND p."occurredAt" >= ${a} AND p."occurredAt" < ${b}
    ),
    t AS (
      SELECT cid,
        COUNT(DISTINCT "visitorId")::int AS visitors,
        COUNT(DISTINCT "sessionId")::int AS visits,
        (COUNT(*) FILTER (WHERE kind = 'list'))::int AS list_views,
        (COUNT(*) FILTER (WHERE kind = 'book'))::int AS book_views
      FROM touches GROUP BY cid
    ),
    r AS (
      SELECT bc."categoryId" AS cid,
        (COUNT(DISTINCT e."sessionId") FILTER (WHERE e."deltaSec" > 0 OR e."type" = 'FINISH'))::int AS sessions,
        COALESCE(SUM(e."deltaSec"), 0)::float8 AS seconds
      FROM "ReadingEvent" e
      JOIN "BookCategory" bc ON bc."bookId" = e."bookId"
      WHERE e."occurredAt" >= ${a} AND e."occurredAt" < ${b}
      GROUP BY bc."categoryId"
    ),
    n AS (SELECT "categoryId" AS cid, COUNT(*)::int AS books FROM "BookCategory" GROUP BY 1)
    SELECT c."id", c.name, c.slug,
      COALESCE(n.books, 0) AS books,
      COALESCE(t.visitors, 0) AS visitors,
      COALESCE(t.visits, 0) AS visits,
      COALESCE(t.list_views, 0) AS list_views,
      COALESCE(t.book_views, 0) AS book_views,
      COALESCE(r.sessions, 0) AS reading_sessions,
      COALESCE(r.seconds, 0) AS reading_sec
    FROM "Category" c
    LEFT JOIN t ON t.cid = c."id"
    LEFT JOIN r ON r.cid = c."id"
    LEFT JOIN n ON n.cid = c."id"
    ORDER BY visits DESC, visitors DESC, c.name
  `)) as Array<Record<string, unknown>>;
}

async function categories(
  run: SqlRunner,
  cur: Bounds,
  prev: Bounds | null,
): Promise<CategoryStat[]> {
  const [rows, prevRows] = await Promise.all([
    categoryStats(run, cur),
    prev ? categoryStats(run, prev) : null,
  ]);
  const prevMap = new Map((prevRows ?? []).map((r) => [String(r.id), r]));
  return rows.map((r) => {
    const p = prevMap.get(String(r.id));
    return {
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      books: num(r.books),
      visitors: num(r.visitors),
      visits: num(r.visits),
      listViews: num(r.list_views),
      bookViews: num(r.book_views),
      readingSessions: num(r.reading_sessions),
      readingSec: num(r.reading_sec),
      prevVisitors: prevRows ? num(p?.visitors) : null,
      prevVisits: prevRows ? num(p?.visits) : null,
    };
  });
}

// ───────────── รวมทั้งหมด ─────────────

export async function getDashboardData(
  range: ResolvedRange,
  run: SqlRunner,
): Promise<DashboardData> {
  const cur = bounds(range.from, range.to);
  const prev = bounds(range.prevFrom, range.prevTo);

  const [
    traffic,
    visitorsSplit,
    reading,
    catalogInfo,
    series,
    heat,
    pages,
    bookPages,
    deviceInfo,
    sourceInfo,
    books,
    ddc,
    admin,
    prevTraffic,
    prevReading,
    prevSeries,
    totals,
    categoryInfo,
  ] = await Promise.all([
    trafficSummary(run, cur),
    newVsReturning(run, cur),
    readingSummary(run, cur),
    catalog(run, cur),
    buildSeries(run, range.from, range.to, range.granularity),
    heatmaps(run, cur),
    topPages(run, cur),
    topBookPages(run, cur),
    devices(run, cur),
    sources(run, cur),
    topBooks(run, cur),
    readingByDdc(run, cur),
    adminSections(run, cur),
    range.compare ? trafficSummary(run, prev) : null,
    range.compare ? readingSummary(run, prev) : null,
    range.compare
      ? buildSeries(run, range.prevFrom, range.prevTo, range.granularity)
      : null,
    siteTotals(run),
    categories(run, cur, range.compare ? prev : null),
  ]);

  return {
    range,
    totals,
    categories: categoryInfo,
    summary: {
      public: traffic.public,
      admin: traffic.admin,
      ...visitorsSplit,
      reading,
      catalog: catalogInfo,
    },
    previous:
      prevTraffic && prevReading
        ? {
            public: prevTraffic.public,
            admin: prevTraffic.admin,
            reading: prevReading,
          }
        : null,
    series,
    previousSeries: prevSeries,
    heatmap: heat,
    topPages: pages,
    topBookPages: bookPages,
    devices: deviceInfo,
    sources: sourceInfo,
    topBooks: books,
    ddc,
    adminSections: admin,
    generatedAt: new Date().toISOString(),
  };
}
