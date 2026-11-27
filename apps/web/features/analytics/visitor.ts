"use client";

/**
 * ตัวระบุผู้เยี่ยมชมแบบไม่ระบุตัวตน (ไม่มี IP / ชื่อ / อีเมล)
 * - visitorId: uuid สุ่ม เก็บถาวรใน localStorage ของเบราว์เซอร์ → นับ "จำนวนผู้เข้าชม"
 * - site session: uuid ต่อการเข้าใช้ 1 ครั้ง ใช้ร่วมกันทุกแท็บ หมดอายุเมื่อไม่มีการใช้งาน 30 นาที
 */

const VISITOR_KEY = "lib_visitor_id";
const SESSION_KEY = "lib_site_session";
const SESSION_IDLE_MS = 30 * 60 * 1000;

/** crypto.randomUUID ใช้ได้เฉพาะ HTTPS/localhost และ iOS 15.4+ → มีตัวสำรอง */
export function newUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ถ้า localStorage ใช้ไม่ได้ (เช่นโหมดส่วนตัวบางรุ่น) ใช้ค่าในหน่วยความจำแทน
let memoryVisitor: string | null = null;
let memorySession: { id: string; last: number } | null = null;

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = newUuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    memoryVisitor ??= newUuid();
    return memoryVisitor;
  }
}

/** ต่ออายุ session (หรือเริ่มใหม่ถ้าว่างเกิน 30 นาที) */
export function touchSiteSession(now = Date.now()): {
  sessionId: string;
  isNew: boolean;
} {
  let current: { id: string; last: number } | null = null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    current = raw ? (JSON.parse(raw) as { id: string; last: number }) : null;
  } catch {
    current = memorySession;
  }

  const isNew =
    !current ||
    typeof current.id !== "string" ||
    now - current.last > SESSION_IDLE_MS;
  const next = { id: isNew ? newUuid() : current!.id, last: now };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    memorySession = next;
  }
  return { sessionId: next.id, isNew };
}

export type DeviceKind = "MOBILE" | "TABLET" | "DESKTOP";

export function detectDevice(): DeviceKind {
  const ua = navigator.userAgent;
  // iPadOS 13+ รายงานตัวเองเป็น Mac → ดูจากจอสัมผัส
  if (
    /iPad|Tablet/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  ) {
    return "TABLET";
  }
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "TABLET";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "MOBILE";
  return "DESKTOP";
}

/** host ของเว็บต้นทาง (ตัด www.) — แอป LINE/Facebook มักไม่ส่ง referrer จึงเดาจาก user agent */
export function externalReferrerHost(): string | null {
  const ua = navigator.userAgent;
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host && host !== location.hostname) return host.replace(/^www\./, "");
    }
  } catch {
    // referrer ไม่ใช่ URL ที่ถูกต้อง
  }
  if (/\bLine\//i.test(ua)) return "line.me";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook.com";
  return null;
}
