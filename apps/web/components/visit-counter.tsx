"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

type VisitStats = {
  total: number;
  thisYear: number;
  yearBE: number;
  since: string | null;
};

const nf = new Intl.NumberFormat("th-TH");

/** ตัวนับการเข้าชมเว็บไซต์ (ทั้งหมด / ปีนี้) สำหรับ footer หน้าบ้าน */
export function VisitCounter() {
  const [stats, setStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/visits")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success) setStats(json.data as VisitStats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const yearBE = stats?.yearBE ?? new Date().getFullYear() + 543;

  return (
    <div
      className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm"
      aria-live="polite"
    >
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-purple-100">
        <BarChart3 className="size-4 text-purple-300" aria-hidden />
        สถิติการเข้าชมเว็บไซต์
      </p>
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[11px] text-purple-200/70">ทั้งหมด</dt>
          <dd className="text-xl font-bold tabular-nums text-white">
            {stats ? nf.format(stats.total) : <Placeholder />}
            <span className="ml-1 text-xs font-normal text-purple-200/70">
              ครั้ง
            </span>
          </dd>
        </div>
        <div className="border-l border-white/10 pl-3">
          <dt className="text-[11px] text-purple-200/70">ปี {yearBE}</dt>
          <dd className="text-xl font-bold tabular-nums text-white">
            {stats ? nf.format(stats.thisYear) : <Placeholder />}
            <span className="ml-1 text-xs font-normal text-purple-200/70">
              ครั้ง
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Placeholder() {
  return (
    <span className="inline-block h-5 w-14 animate-pulse rounded bg-white/10 align-middle" />
  );
}
