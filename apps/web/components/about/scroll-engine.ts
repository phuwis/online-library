"use client";

/**
 * วงรอบ requestAnimationFrame กลางที่ทุกเอฟเฟกต์ parallax ในหน้าใช้ร่วมกัน
 * (มี scroll listener ตัวเดียว คำนวณทุกอย่างในเฟรมเดียว → ลื่นกว่าแยกกันฟัง)
 */

type FrameFn = () => void;

const subscribers = new Set<FrameFn>();
let raf = 0;
let listening = false;

function run() {
  raf = 0;
  subscribers.forEach((fn) => fn());
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(run);
}

/** สมัครรับการคำนวณทุกครั้งที่เลื่อน/ปรับขนาดจอ (เรียกครั้งแรกทันที) คืนฟังก์ชันยกเลิก */
export function subscribeFrame(fn: FrameFn) {
  subscribers.add(fn);
  if (!listening) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    listening = true;
  }
  schedule();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && listening) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      listening = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** ผู้ใช้ตั้งค่าลดการเคลื่อนไหวไว้ → ปิด parallax ทั้งหมด */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, v));
