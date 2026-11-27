"use client";

import { useCallback, useEffect, useRef } from "react";
import { getVisitorId, newUuid } from "@/features/analytics/visitor";

const HEARTBEAT_MS = 30_000;
const MAX_DELTA_SEC = 120; // ต้องตรงกับ trackEventSchema

type EventType = "OPEN" | "HEARTBEAT" | "CLOSE" | "FINISH";

/**
 * ส่ง event การอ่านไป /api/track
 * - เริ่มทำงานเมื่อมี bookId (id ของ Book ไม่ใช่ slug) — ส่ง null ระหว่างรอโหลดข้อมูลได้
 * - นับเฉพาะเวลาที่แท็บมองเห็นอยู่ (visible)
 * - OPEN ตอนเริ่ม, HEARTBEAT ทุก 30 วินาที, CLOSE ตอนปิดหน้า/ซ่อนแอป, FINISH เมื่ออ่านถึง ~98%
 */
export function useReadingTracker(bookId: string | null | undefined) {
  const percent = useRef(0);
  const pendingSec = useRef(0);
  const finished = useRef(false);
  const sessionId = useRef<string | null>(null);

  const send = useCallback(
    (type: EventType, beacon = false) => {
      if (!sessionId.current || !bookId) return;
      const deltaSec = Math.min(pendingSec.current, MAX_DELTA_SEC);
      // CLOSE ซ้ำ (pagehide + unmount) ที่ไม่มีเวลาค้าง → ไม่ต้องส่ง
      if (type === "CLOSE" && deltaSec === 0) return;
      const body = JSON.stringify({
        bookId,
        sessionId: sessionId.current,
        visitorId: getVisitorId(),
        type,
        percent: percent.current,
        deltaSec,
      });
      pendingSec.current -= deltaSec;
      if (beacon && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(
          "/api/track",
          new Blob([body], { type: "application/json" }),
        );
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    },
    [bookId],
  );

  useEffect(() => {
    if (!bookId) return;
    sessionId.current = newUuid();
    finished.current = false;
    pendingSec.current = 0;
    send("OPEN");

    const tick = setInterval(() => {
      if (document.visibilityState === "visible") pendingSec.current += 1;
    }, 1000);
    const heartbeat = setInterval(() => {
      if (pendingSec.current > 0) send("HEARTBEAT");
    }, HEARTBEAT_MS);
    // iOS Safari มักไม่ยิง pagehide ตอนสลับแอป → ส่งเวลาที่ค้างตอนหน้าถูกซ่อนด้วย
    const onHidden = () => {
      if (document.visibilityState === "hidden") send("CLOSE", true);
    };
    const onPageHide = () => send("CLOSE", true);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(tick);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      send("CLOSE", true);
      sessionId.current = null;
    };
  }, [bookId, send]);

  /** เรียกทุกครั้งที่ตำแหน่งการอ่านเปลี่ยน (0..1) */
  const setPercent = useCallback(
    (p: number) => {
      percent.current = Math.max(0, Math.min(1, p));
      if (!finished.current && percent.current >= 0.98) {
        finished.current = true;
        send("FINISH");
      }
    },
    [send],
  );

  return { setPercent };
}
