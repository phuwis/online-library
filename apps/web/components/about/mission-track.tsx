"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AboutImage, type ImageSlot } from "./about-image";
import { clamp, prefersReducedMotion, subscribeFrame } from "./scroll-engine";

export type Mission = {
  title: string;
  body: string;
  points: string[];
  image: ImageSlot;
};

/** จอที่ใช้โหมดตรึงแล้วเลื่อนแนวนอน */
const PIN_QUERY = "(min-width: 1024px) and (min-height: 640px)";

/**
 * ภารกิจแบบตรึงหน้าจอ: เลื่อนลง → แผงภารกิจเลื่อนไปทางซ้ายทีละแผง
 * จอเล็ก / ผู้ใช้ตั้งค่าลดการเคลื่อนไหว → แสดงเรียงลงมาตามปกติ
 */
export function MissionTrack({
  eyebrow,
  title,
  missions,
}: {
  eyebrow: string;
  title: string;
  missions: Mission[];
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const sync = () => setPinned(mq.matches && !prefersReducedMotion());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!pinned) {
      if (track) track.style.transform = "";
      return;
    }
    return subscribeFrame(() => {
      const sec = sectionRef.current;
      const tr = trackRef.current;
      if (!sec || !tr) return;
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp(-r.top / Math.max(r.height - vh, 1));
      const distance = Math.max(tr.scrollWidth - window.innerWidth, 0);
      tr.style.transform = `translate3d(${(-p * distance).toFixed(1)}px, 0, 0)`;
      if (barRef.current)
        barRef.current.style.transform = `scaleX(${p.toFixed(3)})`;
      const idx = Math.min(
        missions.length - 1,
        Math.round(p * (missions.length - 1)),
      );
      setActive((prev) => (prev === idx ? prev : idx));
    });
  }, [pinned, missions.length]);

  return (
    <div
      ref={sectionRef}
      className="relative"
      // ความสูงของช่วงตรึง: ยิ่งยาว ยิ่งเลื่อนช้า (ประมาณ 70vh ต่อแผง)
      style={pinned ? { height: `${missions.length * 70 + 30}vh` } : undefined}
    >
      <div
        className={
          pinned
            ? "sticky top-16 flex h-[calc(100dvh-4rem)] flex-col justify-center overflow-hidden"
            : "py-4"
        }
      >
        <div className="mx-auto mb-8 flex w-full max-w-6xl items-end justify-between gap-6 px-4 sm:px-6 md:px-8">
          <div>
            <p className="text-sm font-bold tracking-wide text-amber-600 dark:text-amber-300">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
          </div>
          {pinned && (
            <div className="hidden w-56 shrink-0 space-y-2 md:block">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>
                  ภารกิจที่ {active + 1} / {missions.length}
                </span>
                <span className="text-foreground">
                  {missions[active]?.title}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-purple-500/15">
                <span
                  ref={barRef}
                  className="block h-full origin-left rounded-full bg-gradient-to-r from-purple-500 to-amber-400"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          ref={trackRef}
          className={
            pinned
              ? "flex w-max gap-8 pl-[max(1rem,calc((100vw-72rem)/2+2rem))] pr-[12vw] will-change-transform"
              : "mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:px-8"
          }
        >
          {missions.map((m, i) => (
            <article
              key={m.title}
              className={`grid overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_24px_60px_rgba(46,16,101,0.15)] backdrop-blur-sm md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] ${
                pinned
                  ? "h-[min(30rem,calc(100dvh-15rem))] w-[min(62rem,78vw)]"
                  : ""
              }`}
            >
              <AboutImage
                slot={m.image}
                className={
                  pinned
                    ? "h-full"
                    : "aspect-[16/10] md:aspect-auto md:min-h-72"
                }
                sizes="(min-width: 1024px) 30vw, 100vw"
              />
              <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
                <span className="text-6xl font-black leading-none tracking-tighter text-purple-500/15 dark:text-purple-300/15">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
                  {m.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {m.body}
                </p>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {m.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
