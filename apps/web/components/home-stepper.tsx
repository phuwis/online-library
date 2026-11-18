"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Clock,
  House,
  Library,
  MapPin,
  type LucideIcon,
} from "lucide-react";

/**
 * ตัวบอกตำแหน่ง section ในหน้าแรก (step progress)
 * แถบแนวตั้งด้านขวา มีเส้นเติมตามการเลื่อน กดเพื่อไปยัง section ได้
 * แสดงเฉพาะคอมพิวเตอร์ (จอ ≥1280px + ใช้เมาส์/ทัชแพด) — ไม่แสดงบนโทรศัพท์/แท็บเล็ต
 *
 * ตำแหน่งแต่ละ section อ่านจาก element ที่มี id ตาม `steps[].id`
 * (หน้าแรกใช้ marker สูง 0px วางก่อนแต่ละ section เพราะตัว section เป็น sticky
 *  ซึ่งตำแหน่งบนจอไม่บอกว่าเลื่อนถึงไหนแล้ว) ส่วน step สุดท้ายใช้ #site-footer
 * ถ้าหา element ของ step ไหนไม่เจอ จะข้าม step นั้น
 * (footer ที่หาไม่เจอจะดูจากการเลื่อนถึงท้ายหน้าแทน)
 *
 * render ผ่าน portal ไปที่ <body> เพราะ <main> โดนใส่ filter ตอนเลื่อนถึง footer
 * (filter ทำให้ position: fixed ของลูกเพี้ยน และจะเบลอตามไปด้วย)
 */

const ICONS = {
  home: House,
  continue: Clock,
  bookmark: Bookmark,
  shelf: Library,
  contact: MapPin,
} satisfies Record<string, LucideIcon>;

export type HomeStep = {
  id: string;
  label: string;
  icon: keyof typeof ICONS;
};

const HEADER_H = 64;
/** คอมพิวเตอร์ที่จอกว้างพอ และใช้เมาส์/ทัชแพด (ตัดโทรศัพท์และแท็บเล็ตทุกขนาดออก) */
const DESKTOP_QUERY =
  "(min-width: 1280px) and (hover: hover) and (pointer: fine)";

export function HomeStepper({ steps }: { steps: HomeStep[] }) {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(0);
  /** 0..1 สัดส่วนความยาวเส้นที่เติมแล้ว */
  const [fill, setFill] = useState(0);

  const measure = useCallback(() => {
    const last = steps.length - 1;
    const vh = window.innerHeight;
    const scroller = document.scrollingElement ?? document.documentElement;
    // จุดอ้างอิง: ใต้ header ลงมา 35% ของพื้นที่จอ
    const ref = HEADER_H + (vh - HEADER_H) * 0.35;

    // ตำแหน่งบนจอของแต่ละ section (null = หา element ไม่เจอ → ข้าม)
    const tops = steps
      .slice(0, last)
      .map(
        (st) =>
          document.getElementById(st.id)?.getBoundingClientRect().top ?? null,
      );

    // step สุดท้าย (footer): ถือว่าถึงเมื่อโผล่เกินครึ่ง หรือเลื่อนสุดหน้าแล้ว
    const atBottom = scroller.scrollTop + vh >= scroller.scrollHeight - 2;
    let footerShown = atBottom ? 1 : 0;
    const footerEl = document.getElementById(steps[last]!.id);
    if (footerEl) {
      const r = footerEl.getBoundingClientRect();
      footerShown =
        Math.min(Math.max(vh - r.top, 0), r.height) / Math.max(r.height, 1);
    }

    let i = 0;
    tops.forEach((t, k) => {
      if (t !== null && t <= ref) i = k;
    });

    let pos: number;
    if (atBottom || footerShown >= 0.5) {
      i = last;
      pos = last;
    } else {
      // step ถัดไปที่มี element จริง (ถ้าไม่มีแล้ว ถัดไปคือ footer)
      let j = i + 1;
      while (j < last && tops[j] === null) j++;
      const ti = tops[i];
      const tj = j < last ? tops[j] : null;
      const frac =
        ti == null || tj == null
          ? Math.min(footerShown / 0.5, 1)
          : Math.min(Math.max((ref - ti) / Math.max(tj - ti, 1), 0), 1);
      pos = i + frac * (j - i);
    }

    setActive(i);
    setFill(last > 0 ? Math.min(pos / last, 1) : 0);
  }, [steps]);

  // เปิด/ปิดตามชนิดอุปกรณ์ (ย่อ/ขยายหน้าต่างแล้วอัปเดตทันที)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // ตอน dev: เตือนใน Console ถ้าหา element ของ step ไม่เจอ (เช่น ลืมใส่ <StepMarker id="..." />)
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === "production") return;
    const missing = steps
      .map((st) => st.id)
      .filter((id) => !document.getElementById(id));
    if (missing.length > 0) {
      console.warn(
        `[HomeStepper] ไม่พบ element id: ${missing.join(", ")} — ตัวบอกตำแหน่งจะข้าม step เหล่านี้`,
      );
    }
  }, [enabled, steps]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          measure();
        });
    };
    measure();
    // capture: true → รับ scroll ของทุก element (ไม่ใช่แค่ window) เผื่อหน้าเลื่อนด้วย container อื่น
    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, measure]);

  const goTo = (index: number) => {
    const isLast = index === steps.length - 1;
    const el = document.getElementById(steps[index]!.id);
    if (!el && !isLast) return;
    const top = isLast
      ? document.documentElement.scrollHeight
      : el!.getBoundingClientRect().top + window.scrollY - HEADER_H;
    window.scrollTo({ top, behavior: "smooth" });
  };

  if (!enabled) return null;

  return createPortal(
    <nav
      aria-label="ส่วนต่างๆ ของหน้าแรก"
      className="fixed right-3 top-1/2 -translate-y-1/2 z-40"
    >
      <ol className="relative flex flex-col items-center gap-5 rounded-full border border-white/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-[0_8px_30px_rgba(88,28,135,0.18)] px-2 py-4">
        {/* เส้นเชื่อม + เส้นที่เติมตามการเลื่อน */}
        <span
          aria-hidden
          className="absolute left-1/2 top-7 bottom-7 w-0.5 -translate-x-1/2 rounded-full bg-purple-900/15 dark:bg-white/15"
        />
        <span
          aria-hidden
          data-stepper-fill
          className="absolute left-1/2 top-7 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500 transition-[height] duration-200"
          style={{ height: `calc((100% - 3.5rem) * ${fill.toFixed(4)})` }}
        />

        {steps.map((step, i) => {
          const Icon = ICONS[step.icon];
          const isActive = i === active;
          const done = i < active;
          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}. ${step.label}`}
                aria-current={isActive ? "step" : undefined}
                className="group relative flex size-8 items-center justify-center rounded-full outline-none"
              >
                <span
                  className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? "size-8 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/40 ring-4 ring-purple-500/20"
                      : done
                        ? "size-3.5 bg-purple-500"
                        : "size-3.5 border-2 border-purple-400/60 bg-white dark:bg-slate-900"
                  } group-hover:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-purple-500/40`}
                >
                  {isActive && <Icon className="size-4" />}
                </span>

                {/* ป้ายชื่อด้านซ้าย: แสดงเสมอสำหรับ step ปัจจุบัน, step อื่นแสดงเมื่อชี้/โฟกัส */}
                <span
                  className={`pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold shadow-md transition-all duration-200 ${
                    isActive
                      ? "opacity-100 translate-x-0 bg-purple-950 text-white"
                      : "opacity-0 translate-x-1 bg-white text-purple-950 dark:bg-slate-800 dark:text-white group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100"
                  }`}
                >
                  <span className="opacity-60 mr-1">{i + 1}</span>
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>,
    document.body,
  );
}
