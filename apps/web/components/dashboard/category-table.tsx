"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownWideNarrow } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { CategoryStat } from "@/features/analytics/dashboard-types";
import { change, fmtDuration, fmtNumber, safeRatio } from "./format";
import { DeltaChip } from "./kpi";

type SortKey =
  | "visits"
  | "visitors"
  | "listViews"
  | "bookViews"
  | "readingSessions"
  | "readingSec";

const COLUMNS: Array<{ key: SortKey; label: string; hint: string }> = [
  {
    key: "visitors",
    label: "จำนวนเครื่อง",
    hint: "เครื่อง/เบราว์เซอร์ที่เข้าดูหมวดนี้ ไม่นับซ้ำ",
  },
  {
    key: "visits",
    label: "จำนวนครั้ง (รวมเข้าซ้ำ)",
    hint: "จำนวนครั้งที่เข้าเว็บไซต์แล้วมีการเข้าดูหมวดนี้",
  },
  {
    key: "listViews",
    label: "เปิดรายการหมวด",
    hint: "เลือกหมวดนี้ในหน้าหนังสือทั้งหมด",
  },
  {
    key: "bookViews",
    label: "เปิดหนังสือในหมวด",
    hint: "เปิดหน้ารายละเอียดหรือหน้าอ่านของหนังสือในหมวดนี้",
  },
  {
    key: "readingSessions",
    label: "เปิดอ่าน",
    hint: "ครั้งที่มีการอ่านจริงของหนังสือในหมวดนี้",
  },
  {
    key: "readingSec",
    label: "เวลาอ่าน",
    hint: "เวลาอ่านรวมของหนังสือในหมวดนี้",
  },
];

/** ตารางสถิติตามหมวดหมู่ที่สร้างในระบบ (ตาราง Category) */
export function CategoryTable({
  rows,
  compare,
}: {
  rows: CategoryStat[];
  compare: boolean;
}) {
  const [sort, setSort] = useState<SortKey>("visits");
  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          b[sort] - a[sort] ||
          b.visits - a.visits ||
          a.name.localeCompare(b.name, "th"),
      ),
    [rows, sort],
  );
  const maxVisits = Math.max(0, ...rows.map((r) => r.visits));

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        ยังไม่มีหมวดหมู่ในระบบ
      </p>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-y border-border/60 bg-muted/30 text-xs text-muted-foreground">
            <th className="px-4 py-2.5 font-medium sm:px-5">หมวดหมู่</th>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className="px-2 py-2.5 text-right font-medium last:pr-4 sm:last:pr-5"
              >
                <button
                  type="button"
                  title={c.hint}
                  onClick={() => setSort(c.key)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground",
                    sort === c.key && "font-semibold text-foreground",
                  )}
                >
                  {sort === c.key && (
                    <ArrowDownWideNarrow className="size-3.5" aria-hidden />
                  )}
                  {c.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 sm:px-5">
                <Link
                  href={`/books?category=${encodeURIComponent(r.slug)}`}
                  target="_blank"
                  className="font-medium text-foreground hover:underline"
                >
                  {r.name}
                </Link>
                <div className="mt-1.5 flex items-center gap-2">
                  <div
                    className="h-1.5 w-24 rounded-full"
                    style={{ background: "var(--viz-empty)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${r.visits ? Math.max(3, safeRatio(r.visits, maxVisits) * 100) : 0}%`,
                        background: "var(--viz-1)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {fmtNumber(r.books)} เล่ม
                  </span>
                </div>
              </td>
              <td className="px-2 py-3 text-right tabular-nums">
                {fmtNumber(r.visitors)}
              </td>
              <td className="px-2 py-3 text-right">
                <div className="font-semibold tabular-nums">
                  {fmtNumber(r.visits)}
                </div>
                {compare && r.prevVisits !== null && (
                  <div className="mt-1 flex justify-end text-[11px]">
                    <DeltaChip delta={change(r.visits, r.prevVisits)} />
                  </div>
                )}
              </td>
              <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">
                {fmtNumber(r.listViews)}
              </td>
              <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">
                {fmtNumber(r.bookViews)}
              </td>
              <td className="px-2 py-3 text-right tabular-nums">
                {fmtNumber(r.readingSessions)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground sm:px-5">
                {r.readingSec > 0 ? fmtDuration(r.readingSec) : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 pt-3 text-[11px] text-muted-foreground sm:px-5">
        หนังสือ 1 เล่มอยู่ได้หลายหมวด จึงนับให้ทุกหมวดที่เล่มนั้นอยู่ ·
        คลิกหัวคอลัมน์เพื่อเรียงลำดับ
      </p>
    </div>
  );
}
