"use client";

import { useEffect } from "react";

/**
 * เมื่อเลื่อนถึง footer: เนื้อหาด้านหลัง (#site-main) ค่อยๆ เบลอและจางลงตามสัดส่วนที่ footer โผล่
 * ปรับค่าเอฟเฟกต์ได้ที่ MAX_BLUR_PX / MAX_FADE
 */
const MAX_BLUR_PX = 6;
const MAX_FADE = 0.35;

export function FooterFocusEffect({
  footerId = "site-footer",
  targetId = "site-main",
}: {
  footerId?: string;
  targetId?: string;
}) {
  useEffect(() => {
    const footer = document.getElementById(footerId);
    const target = document.getElementById(targetId);
    if (!footer || !target) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = footer.getBoundingClientRect();
      const visible = Math.min(
        Math.max(window.innerHeight - rect.top, 0),
        rect.height,
      );
      const p = rect.height > 0 ? visible / rect.height : 0;
      if (p <= 0.01) {
        // ไม่ใส่ filter เลยตอนไม่ถึง footer (ประหยัดการ render)
        target.style.filter = "";
        target.style.opacity = "";
        return;
      }
      target.style.filter = `blur(${(p * MAX_BLUR_PX).toFixed(2)}px)`;
      target.style.opacity = String(1 - p * MAX_FADE);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      target.style.filter = "";
      target.style.opacity = "";
    };
  }, [footerId, targetId]);

  return null;
}
