import type { ResolvedRange } from "./range";

export type DeviceKey = "MOBILE" | "TABLET" | "DESKTOP";

export type AreaTraffic = {
  /** จำนวนหน้าที่ถูกเปิด */
  pageviews: number;
  /** จำนวนครั้งที่เข้าใช้ (session) */
  sessions: number;
  /** จำนวนผู้เข้าชม (เบราว์เซอร์/อุปกรณ์ไม่ซ้ำ) */
  visitors: number;
  /** session ที่เปิดแค่หน้าเดียวแล้วออก */
  bounces: number;
};

export type ReadingSummary = {
  sessions: number;
  readers: number;
  totalSec: number;
  finishes: number;
  booksRead: number;
  /** ตำแหน่งที่อ่านไปถึงเฉลี่ยต่อครั้ง 0..1 */
  avgPercent: number;
};

export type SeriesPoint = {
  key: string;
  visitors: number;
  pageviews: number;
  sessions: number;
  adminSessions: number;
  adminPageviews: number;
  readingSessions: number;
  readingSec: number;
  readers: number;
};

/** การเข้าชมหน้าบ้านสะสม (ไม่ขึ้นกับช่วงเวลาที่เลือก) */
export type SiteTotals = {
  allTime: { visitors: number; visits: number; pageviews: number };
  thisYear: {
    visitors: number;
    visits: number;
    pageviews: number;
    yearBE: number;
  };
  /** วันแรกที่เริ่มเก็บข้อมูล (YYYY-MM-DD เวลาไทย) */
  since: string | null;
};

export type CategoryStat = {
  id: string;
  name: string;
  slug: string;
  /** จำนวนหนังสือในหมวด (ทุกสถานะ) */
  books: number;
  /** จำนวนเครื่อง/เบราว์เซอร์ที่เข้าดูหมวดนี้ */
  visitors: number;
  /** จำนวนครั้งที่เข้าใช้ (รวมเข้าซ้ำ) ที่มีการเข้าดูหมวดนี้ */
  visits: number;
  /** เปิดรายการหนังสือของหมวด (/books?category=…) */
  listViews: number;
  /** เปิดหน้ารายละเอียด/หน้าอ่านของหนังสือในหมวด */
  bookViews: number;
  readingSessions: number;
  readingSec: number;
  prevVisitors: number | null;
  prevVisits: number | null;
};

export type DashboardData = {
  range: ResolvedRange;
  totals: SiteTotals;
  categories: CategoryStat[];
  summary: {
    public: AreaTraffic;
    admin: AreaTraffic;
    newVisitors: number;
    returningVisitors: number;
    reading: ReadingSummary;
    catalog: {
      published: number;
      addedInRange: number;
      unreadPublished: number;
    };
  };
  previous: {
    public: AreaTraffic;
    admin: AreaTraffic;
    reading: ReadingSummary;
  } | null;
  series: SeriesPoint[];
  /** ช่วงก่อนหน้า เรียงตาม bucket เดียวกับ series (อาจสั้นกว่า) */
  previousSeries: SeriesPoint[] | null;
  /** [วันจันทร์..อาทิตย์][0..23 น.] */
  heatmap: { pageviews: number[][]; readingSec: number[][] };
  topPages: Array<{
    path: string;
    label: string;
    pageviews: number;
    visitors: number;
  }>;
  topBookPages: Array<{
    slug: string;
    title: string;
    pageviews: number;
    visitors: number;
  }>;
  devices: Record<
    "public" | "admin",
    Record<DeviceKey, { visitors: number; pageviews: number }>
  >;
  sources: Array<{ source: string; label: string; sessions: number }>;
  topBooks: Array<{
    id: string;
    slug: string;
    title: string;
    author: string;
    ddc: string;
    sessions: number;
    readers: number;
    totalSec: number;
    finishes: number;
    avgPercent: number;
  }>;
  ddc: Array<{
    ddc: string;
    code: string;
    label: string;
    sessions: number;
    totalSec: number;
    books: number;
  }>;
  adminSections: Array<{
    section: string;
    label: string;
    pageviews: number;
    sessions: number;
  }>;
  generatedAt: string;
};
