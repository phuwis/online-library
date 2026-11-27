"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  detectDevice,
  externalReferrerHost,
  getVisitorId,
  touchSiteSession,
} from "@/features/analytics/visitor";

/**
 * บันทึกการเปิดหน้าเว็บทุกหน้า (ทั้งหน้าบ้านและหลังบ้าน) → /api/track/view
 * - ฝั่งของเว็บ (PUBLIC / ADMIN) เซิร์ฟเวอร์ตัดสินจาก path เอง
 * - หน้า /books: การเลือกหมวดหมู่ (?category=slug) นับเป็นการเปิดดูหมวดหมู่นั้น 1 ครั้ง
 *   (การพิมพ์ค้นหา/ตัวกรองอื่น ๆ ไม่นับเพิ่ม)
 * วางไว้ครั้งเดียวใน app/layout.tsx (ครอบด้วย <Suspense> เพราะใช้ useSearchParams)
 */
export function SiteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = pathname === "/books" ? searchParams.get("category") : null;
  const last = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api")) return;

    // กันส่งซ้ำจาก React StrictMode (dev) / render ซ้ำของหน้าเดิม
    const key = `${pathname}|${category ?? ""}`;
    const now = Date.now();
    if (last.current?.key === key && now - last.current.at < 2000) return;
    last.current = { key, at: now };

    const { sessionId, isNew } = touchSiteSession(now);
    const body = JSON.stringify({
      path: pathname,
      visitorId: getVisitorId(),
      sessionId,
      device: detectDevice(),
      referrer: isNew ? externalReferrerHost() : null,
      category: category || null,
    });

    try {
      if (typeof navigator.sendBeacon === "function") {
        const ok = navigator.sendBeacon(
          "/api/track/view",
          new Blob([body], { type: "application/json" }),
        );
        if (ok) return;
      }
      fetch("/api/track/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // สถิติไม่ควรทำให้หน้าเว็บพัง
    }
  }, [pathname, category]);

  return null;
}
