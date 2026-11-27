import { z } from "zod";

export const READING_EVENTS_KEY = "events:reading";
export const READING_EVENTS_FAILED_KEY = "events:reading:failed";

export const EVENT_TYPES = ["OPEN", "HEARTBEAT", "CLOSE", "FINISH"] as const;

/** payload ที่ reader (client) ส่งเข้า /api/track */
export const trackEventSchema = z.object({
  bookId: z.string().min(1).max(64),
  sessionId: z.string().uuid(),
  // id ผู้เยี่ยมชมแบบไม่ระบุตัวตน (ไม่บังคับ เพื่อรองรับ client รุ่นเก่า)
  visitorId: z.string().uuid().nullish(),
  type: z.enum(EVENT_TYPES),
  percent: z.number().min(0).max(1).default(0),
  // heartbeat ทุก 30 วินาที → จำกัดเพดานกันค่าปลอม
  deltaSec: z.number().int().min(0).max(120).default(0),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;

/** รูปแบบที่ถูกเก็บใน Redis queue */
export type QueuedReadingEvent = TrackEventInput & {
  userId: string | null;
  occurredAt: string; // ISO
};

// ───────────── การเข้าชมหน้าเว็บ ─────────────

export const SITE_AREAS = ["PUBLIC", "ADMIN"] as const;
export const DEVICE_TYPES = ["MOBILE", "TABLET", "DESKTOP"] as const;

/** payload ที่ SiteTracker (client) ส่งเข้า /api/track/view */
export const pageViewSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(300)
    .regex(/^\/[^?#\s]*$/),
  visitorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  device: z.enum(DEVICE_TYPES),
  referrer: z.string().max(255).nullish(),
  // slug ของหมวดหมู่ที่เลือกในหน้า /books (ถ้ามี)
  category: z.string().max(120).nullish(),
});
export type PageViewInput = z.infer<typeof pageViewSchema>;

/** pathname → ฝั่งของเว็บ */
export function areaOfPath(path: string): (typeof SITE_AREAS)[number] {
  return path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/login" ||
    path.startsWith("/login/")
    ? "ADMIN"
    : "PUBLIC";
}
