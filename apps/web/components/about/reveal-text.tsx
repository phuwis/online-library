"use client";

import { useEffect, useRef } from "react";
import { clamp, prefersReducedMotion, subscribeFrame } from "./scroll-engine";

/**
 * ข้อความที่ค่อยๆ สว่างขึ้นทีละวลีตามการเลื่อน
 * (ภาษาไทยไม่เว้นวรรคระหว่างคำ จึงให้ส่งมาเป็นวลีที่ตัดไว้แล้ว)
 */
export function RevealText({
  phrases,
  className = "",
}: {
  phrases: string[];
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(
      el.querySelectorAll<HTMLSpanElement>("[data-phrase]"),
    );
    if (prefersReducedMotion()) {
      spans.forEach((s) => (s.style.opacity = "1"));
      return;
    }
    return subscribeFrame(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // เริ่มสว่างเมื่อย่อหน้าเข้ามา 85% ของจอ และสว่างครบเมื่อขึ้นไปถึง 35%
      const p = clamp((vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.6));
      const lit = p * spans.length;
      spans.forEach((s, i) => {
        s.style.opacity = String(0.18 + 0.82 * clamp(lit - i));
      });
    });
  }, [phrases]);

  return (
    <p ref={ref} className={className}>
      {phrases.map((ph, i) => (
        <span
          key={i}
          data-phrase
          className="transition-opacity duration-150"
          style={{ opacity: 0.18 }}
        >
          {ph}
          {i < phrases.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
