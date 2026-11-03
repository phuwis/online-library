"use client";

import { useCallback, useEffect, useRef } from "react";

const HEARTBEAT_MS = 30_000;

type EventType = "OPEN" | "HEARTBEAT" | "CLOSE" | "FINISH";

/**
 * ส่ง event การอ่านไป /api/track
 * - นับเฉพาะเวลาที่แท็บมองเห็นอยู่ (visible)
 * - OPEN ตอนเริ่ม, HEARTBEAT ทุก 30 วินาที, CLOSE ตอนปิดหน้า, FINISH เมื่ออ่านถึง ~98%
 */
export function useReadingTracker(bookId: string) {
  const percent = useRef(0);
  const pendingSec = useRef(0);
  const finished = useRef(false);
  const sessionId = useRef<string | null>(null);

  const send = useCallback(
    (type: EventType, beacon = false) => {
      if (!sessionId.current) return;
      const body = JSON.stringify({
        bookId,
        sessionId: sessionId.current,
        type,
        percent: percent.current,
        deltaSec: Math.min(pendingSec.current, 120),
      });
      pendingSec.current = 0;
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
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
    sessionId.current = crypto.randomUUID();
    send("OPEN");

    const tick = setInterval(() => {
      if (!document.hidden) pendingSec.current += 1;
    }, 1000);
    const heartbeat = setInterval(() => send("HEARTBEAT"), HEARTBEAT_MS);
    const onPageHide = () => send("CLOSE", true);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(tick);
      clearInterval(heartbeat);
      window.removeEventListener("pagehide", onPageHide);
      send("CLOSE", true);
    };
  }, [send]);

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
