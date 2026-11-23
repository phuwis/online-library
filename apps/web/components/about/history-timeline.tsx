"use client";

import { useEffect, useRef, useState } from "react";
import { AboutImage, type ImageSlot } from "./about-image";
import { Parallax } from "./parallax";
import { subscribeFrame } from "./scroll-engine";

export type Milestone = {
  /** เช่น "พ.ศ. 2435" */
  year: string;
  title: string;
  body: string;
  image: ImageSlot;
};

/**
 * ไทม์ไลน์แบบภาพค้าง (sticky) + เนื้อหาเลื่อนผ่าน
 * จอกว้าง: ภาพด้านซ้ายค้างอยู่กลางจอ และเปลี่ยนภาพตามเหตุการณ์ที่กำลังอ่าน (ค่อยๆ ซูมเข้า)
 * จอเล็ก: แต่ละเหตุการณ์มีภาพของตัวเองอยู่ด้านบน
 */
export function HistoryTimeline({ milestones }: { milestones: Milestone[] }) {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    return subscribeFrame(() => {
      const mid = window.innerHeight * 0.5;
      let idx = 0;
      cardRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= mid) idx = i;
      });
      setActive((prev) => (prev === idx ? prev : idx));
    });
  }, []);

  const current = milestones[active]!;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      {/* ภาพค้าง (จอกว้าง) */}
      <div className="hidden lg:block">
        <div className="sticky top-24 flex h-[calc(100dvh-8rem)] items-center">
          <figure className="relative w-full">
            <div className="relative aspect-[4/5] max-h-[calc(100dvh-10rem)] w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_80px_rgba(46,16,101,0.45)]">
              {milestones.map((m, i) => (
                <div
                  key={m.year + m.title}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 transition-all duration-[1200ms] ease-out ${
                    i === active
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-110"
                  }`}
                >
                  <AboutImage
                    slot={m.image}
                    className="size-full"
                    sizes="45vw"
                  />
                </div>
              ))}

              {/* ปีของเหตุการณ์ปัจจุบัน */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-purple-950/90 via-purple-950/40 to-transparent p-6 pt-20">
                <p
                  key={current.year}
                  className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg"
                >
                  {current.year}
                </p>
                <p className="mt-1 text-sm font-medium text-amber-200/90">
                  {current.image.alt}
                </p>
              </div>
            </div>

            {/* ตัวบอกลำดับ */}
            <div className="absolute -right-6 top-1/2 flex -translate-y-1/2 flex-col gap-2">
              {milestones.map((m, i) => (
                <span
                  key={m.year + m.title}
                  className={`w-1.5 rounded-full transition-all duration-500 ${
                    i === active
                      ? "h-8 bg-amber-400"
                      : i < active
                        ? "h-3 bg-purple-400"
                        : "h-3 bg-purple-300/30"
                  }`}
                />
              ))}
            </div>
          </figure>
        </div>
      </div>

      {/* เหตุการณ์ */}
      <ol className="relative space-y-6 lg:space-y-0">
        {/* เส้นไทม์ไลน์ */}
        <span
          aria-hidden
          className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-300/0 via-amber-300/40 to-amber-300/0 lg:left-[15px]"
        />
        {milestones.map((m, i) => {
          const isActive = i === active;
          return (
            <li
              key={m.year + m.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="relative pl-10 lg:flex lg:min-h-[70vh] lg:items-center lg:pl-14"
            >
              {/* จุดบนเส้น */}
              <span
                aria-hidden
                className={`absolute left-0 top-1 flex size-6 items-center justify-center rounded-full border-2 transition-all duration-500 lg:top-1/2 lg:size-8 lg:-translate-y-1/2 ${
                  isActive
                    ? "border-amber-300 bg-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.15)]"
                    : "border-purple-300/50 bg-purple-950"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${isActive ? "bg-purple-950" : "bg-purple-300/60"}`}
                />
              </span>

              <div
                className={`relative w-full transition-all duration-500 ${
                  isActive
                    ? "lg:opacity-100 lg:translate-x-0"
                    : "lg:opacity-35 lg:translate-x-2"
                }`}
              >
                {/* ปีตัวใหญ่ลอยด้านหลัง (เคลื่อนเร็วกว่าเนื้อหา) */}
                <Parallax
                  speed={-0.12}
                  className="pointer-events-none absolute -top-24 right-0 hidden select-none lg:block"
                >
                  <span className="text-8xl font-black tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(233,213,255,0.12)]">
                    {m.year.replace(/[^\d–-]/g, "")}
                  </span>
                </Parallax>

                {/* ภาพของเหตุการณ์ (จอเล็ก) */}
                <AboutImage
                  slot={m.image}
                  className="mb-4 aspect-[16/10] rounded-2xl border border-white/10 lg:hidden"
                  sizes="100vw"
                />

                <p className="text-sm font-bold tracking-wide text-amber-300">
                  {m.year}
                </p>
                <h3 className="mt-1 text-xl font-bold leading-snug text-white sm:text-2xl">
                  {m.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-purple-100/80 sm:text-base">
                  {m.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
