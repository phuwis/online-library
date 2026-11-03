import { z } from "zod";

export const READING_EVENTS_KEY = "events:reading";
export const READING_EVENTS_FAILED_KEY = "events:reading:failed";

export const EVENT_TYPES = ["OPEN", "HEARTBEAT", "CLOSE", "FINISH"] as const;

/** payload ที่ reader (client) ส่งเข้า /api/track */
export const trackEventSchema = z.object({
  bookId: z.string().min(1).max(64),
  sessionId: z.string().uuid(),
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
