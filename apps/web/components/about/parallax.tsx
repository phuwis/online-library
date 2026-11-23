"use client";

import { useEffect, useRef } from "react";
import { clamp, prefersReducedMotion, subscribeFrame } from "./scroll-engine";

/**
 * เลื่อนเนื้อหาด้านในช้า/เร็วกว่าการเลื่อนหน้า ตามตำแหน่งเทียบกับกลางจอ
 * speed > 0 = ลอยช้ากว่า (เหมือนอยู่ไกล), speed < 0 = เคลื่อนสวนทาง/เร็วกว่า (เหมือนอยู่ใกล้)
 * วัดตำแหน่งจากกรอบนอก (ไม่ขยับ) แล้วขยับเฉพาะกรอบใน → ไม่เกิดการวัดค่าที่ตัวเองเพิ่งขยับ
 */
export function Parallax({
  speed = 0.2,
  scale,
  fade,
  className = "",
  innerClassName = "",
  children,
}: {
  speed?: number;
  /** ขยายเพิ่มสูงสุดเมื่อออกห่างจากกลางจอ เช่น 0.08 (ใช้กับภาพพื้นหลังเพื่อไม่ให้เห็นขอบ) */
  scale?: number;
  /** จางลงเมื่อเลื่อนผ่านขึ้นไป (ใช้กับข้อความใน hero) */
  fade?: boolean;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    return subscribeFrame(() => {
      const o = outer.current;
      const i = inner.current;
      if (!o || !i) return;
      const r = o.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -vh || r.top > vh * 2) return; // ไกลจากจอ: ไม่ต้องคำนวณ
      const offset = r.top + r.height / 2 - vh / 2;
      const y = -offset * speed;
      const s = scale ? 1 + scale * clamp(Math.abs(offset) / vh) : 1;
      i.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      if (fade)
        i.style.opacity = String(
          clamp(1 - Math.max(-r.top, 0) / (r.height * 0.7)),
        );
    });
  }, [speed, scale, fade]);

  return (
    <div ref={outer} className={className}>
      <div ref={inner} className={`will-change-transform ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
