"use client";

import { useEffect } from "react";

/**
 * เลื่อนทีละ 1 section + แม่เหล็กดูดเข้าจุดที่เห็นเต็มจอ
 *
 * - ล้อเมาส์/ทัชแพด: 1 gesture = 1 section (เลื่อนแรงแค่ไหนก็ไปได้แค่ section ติดกัน)
 * - ทางอื่น (ลาก scrollbar, คีย์บอร์ด, ทัชสกรีน): พอหยุดเลื่อนก็ดูดเข้า section ที่ใกล้ที่สุด
 * - แอนิเมชันเลื่อนวาดเองด้วย requestAnimationFrame (ไม่ใช้ behavior: "smooth" ของเบราว์เซอร์)
 *   จึงรู้แน่ว่าเลื่อนเสร็จเมื่อไร, ถึงตำแหน่งเป๊ะทุกครั้ง และไม่ถูก input อื่นขัดจนค้างกลางทาง
 * - ใช้ JS แทน CSS scroll-snap เพราะ scroll-snap ตีกับ position: sticky
 * - ทำงานเฉพาะจอ lg ขึ้นไป (ตรงกับที่ section ซ้อนทับกัน)
 * - ช่วง footer (เลยจาก section สุดท้าย) ปล่อยให้เลื่อนอิสระ
 */
const SNAP_THRESHOLD = 0.5; // fallback: เกินครึ่ง = ไปต่อ
const IDLE_MS = 110; // หยุดเลื่อนนานเท่านี้ถึงเริ่มดูด (fallback)
const ANIM_MS = 700; // ระยะเวลาเลื่อนไป section ถัดไป
const WHEEL_QUIET_MS = 100; // เงียบจากล้อนานเท่านี้ = จบ gesture (ใช้แยกแรงเฉื่อยของทัชแพดออกจาก gesture ใหม่)
const WHEEL_THRESHOLD = 40; // ต้องเลื่อนสะสมถึงเท่านี้ (px) ถึงจะเปลี่ยน section — กันสัญญาณรบกวนเล็กๆ จากทัชแพด/ตอนคลิก

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function SectionSnap({ sections }: { sections: number }) {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let animating = false;
    let touching = false;
    let lastWheel = 0;
    let accumulated = 0; // ระยะเลื่อนสะสมของ gesture ปัจจุบัน
    let blocked = false; // เพิ่งเปลี่ยน section: ไม่รับ wheel ที่เหลือ (แรงเฉื่อย) จนกว่าจะเงียบ

    const sectionHeight = () =>
      window.innerHeight -
      parseFloat(getComputedStyle(document.documentElement).fontSize) * 4; // หัก header 4rem

    // กระโดดไปตำแหน่งทันที (กัน CSS scroll-behavior: smooth ของ global มาทำให้ช้า)
    const jump = (y: number) =>
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

    const scheduleSettle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(settle, IDLE_MS);
    };

    const stopAnimation = () => {
      cancelAnimationFrame(raf);
      animating = false;
    };

    const animateTo = (target: number) => {
      stopAnimation();
      const start = window.scrollY;
      const distance = target - start;

      if (Math.abs(distance) < 1 || reduceMotion.matches) {
        jump(target);
        scheduleSettle();
        return;
      }

      animating = true;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / ANIM_MS);
        jump(start + distance * easeInOutCubic(p));
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          jump(target); // ลงเป๊ะ
          animating = false;
          scheduleSettle(); // ตรวจซ้ำว่าไม่ค้างกลางทาง
        }
      };
      raf = requestAnimationFrame(step);
    };

    /* ---------- 1) ล้อเมาส์ / ทัชแพด: ทีละ 1 section ---------- */
    const onWheel = (e: WheelEvent) => {
      if (!desktop.matches || e.ctrlKey) return; // ctrl+wheel = zoom
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // เลื่อนแนวนอน ปล่อยผ่าน
      if ((e.target as HTMLElement | null)?.closest("[data-no-snap]")) return;

      const h = sectionHeight();
      const lastIndex = sections - 1;
      const lastTop = lastIndex * h;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;

      // เงียบนานพอ = เริ่ม gesture ใหม่
      const now = performance.now();
      if (now - lastWheel >= WHEEL_QUIET_MS) {
        blocked = false;
        accumulated = 0;
      }
      lastWheel = now;

      // ปรับหน่วยเป็น px (deltaMode: 0=px, 1=บรรทัด, 2=หน้า)
      const delta =
        e.deltaMode === 1
          ? e.deltaY * 16
          : e.deltaMode === 2
            ? e.deltaY * h
            : e.deltaY;

      // ปลายทางสุดของหน้า (footer เต็มแล้ว) เลื่อนลงต่อไม่ได้ → ปล่อยผ่าน
      if (delta > 0 && y >= maxScroll - 1) return;

      // กันเลื่อนจริงของเบราว์เซอร์ทุกกรณี เพื่อไม่ให้หน้าค้างกลางทาง
      e.preventDefault();

      if (animating || blocked) return;

      // เปลี่ยนทิศกลางทาง → เริ่มสะสมใหม่
      if (accumulated !== 0 && Math.sign(accumulated) !== Math.sign(delta)) {
        accumulated = 0;
      }
      accumulated += delta;
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) return;

      const dir = Math.sign(accumulated);
      accumulated = 0;
      blocked = true; // แรงเฉื่อยที่ตามมาไม่นับ จนกว่าจะเงียบ

      let target: number;
      if (dir > 0) {
        // section สุดท้าย → ไป footer, นอกนั้นไป section ถัดไป
        target = y >= lastTop - 2 ? maxScroll : (Math.round(y / h) + 1) * h;
      } else {
        // อยู่โซน footer → กลับ section สุดท้ายก่อน
        target = y > lastTop + 2 ? lastTop : (Math.round(y / h) - 1) * h;
      }
      animateTo(Math.min(maxScroll, Math.max(0, target)));
    };

    /* ---------- 2) fallback: หยุดเลื่อนแล้วดูดเข้า section ที่ใกล้ที่สุด ---------- */
    function settle() {
      if (!desktop.matches || touching || animating) return;

      const h = sectionHeight();
      const lastTop = (sections - 1) * h;
      const y = window.scrollY;
      if (y > lastTop) return; // โซน footer

      const index = Math.floor(y / h);
      const fraction = y / h - index;
      const target = (fraction >= SNAP_THRESHOLD ? index + 1 : index) * h;
      if (Math.abs(y - target) < 1) return;

      animateTo(target);
    }

    const onTouchStart = () => {
      touching = true;
      stopAnimation();
      clearTimeout(idleTimer);
    };
    const onTouchEnd = () => {
      touching = false;
      scheduleSettle();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", scheduleSettle, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      stopAnimation();
      clearTimeout(idleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", scheduleSettle);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [sections]);

  return null;
}
