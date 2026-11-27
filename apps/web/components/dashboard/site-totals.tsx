import { MonitorSmartphone, Repeat } from "lucide-react";
import type { SiteTotals } from "@/features/analytics/dashboard-types";
import { formatThaiDate } from "@/features/analytics/range";
import { fmtNumber } from "./format";

/** ยอดสะสมการเข้าชมหน้าบ้าน (ไม่ขึ้นกับตัวกรองช่วงเวลา) — แสดงบนสุดของ dashboard */
export function SiteTotalsBand({ totals }: { totals: SiteTotals }) {
  const groups = [
    {
      icon: MonitorSmartphone,
      title: "จำนวนเครื่องที่เข้าชม",
      note: "นับเครื่อง/เบราว์เซอร์ละ 1 ไม่นับซ้ำ",
      unit: "เครื่อง",
      all: totals.allTime.visitors,
      year: totals.thisYear.visitors,
    },
    {
      icon: Repeat,
      title: "จำนวนการเข้าชม",
      note: "นับทุกครั้งที่เข้าเว็บไซต์ รวมการเข้าซ้ำ",
      unit: "ครั้ง",
      all: totals.allTime.visits,
      year: totals.thisYear.visits,
    },
  ];

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold text-foreground">
          การเข้าชมเว็บไซต์สะสม (หน้าบ้าน)
        </h2>
        <p className="text-xs text-muted-foreground">
          ไม่ขึ้นกับช่วงเวลาที่เลือก
          {totals.since && (
            <> · เริ่มเก็บข้อมูล {formatThaiDate(totals.since)}</>
          )}{" "}
          · เปิดดูรวม {fmtNumber(totals.allTime.pageviews)} หน้า
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {groups.map(({ icon: Icon, title, note, unit, all, year }) => (
          <div
            key={title}
            className="rounded-xl border border-border/60 bg-muted/30 p-4"
          >
            <div className="mb-3 flex items-start gap-2">
              <Icon
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground">{note}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 divide-x divide-border/70">
              <div className="pr-3">
                <dt className="text-xs text-muted-foreground">ทั้งหมด</dt>
                <dd className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                  {fmtNumber(all)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {unit}
                  </span>
                </dd>
              </div>
              <div className="pl-4">
                <dt className="text-xs text-muted-foreground">
                  ปี {totals.thisYear.yearBE}
                </dt>
                <dd className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                  {fmtNumber(year)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {unit}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
