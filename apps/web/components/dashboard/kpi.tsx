import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { change, fmtPercent } from "./format";

type KpiProps = {
  label: string;
  value: string;
  /** ค่าดิบ (ใช้คำนวณ % เปลี่ยนแปลง) */
  current: number;
  previous?: number | null;
  /** ข้อความช่วงก่อนหน้า เช่น "1,240 คน" */
  previousText?: string;
  /** เพิ่มขึ้น = ดี (ค่าเริ่มต้น) / false เช่น อัตราออกทันที */
  higherIsBetter?: boolean;
  hint?: string;
  sub?: string;
};

export function Kpi({
  label,
  value,
  current,
  previous,
  previousText,
  higherIsBetter = true,
  hint,
  sub,
}: KpiProps) {
  const delta = change(current, previous);
  const showDelta = previous != null;

  return (
    <div
      className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5"
      title={hint}
    >
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </p>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight tabular-nums text-foreground [overflow-wrap:anywhere] sm:text-[1.6rem]">
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {sub}
          </p>
        )}
      </div>
      {showDelta && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <DeltaChip delta={delta} higherIsBetter={higherIsBetter} />
          {previousText && (
            <span className="truncate text-muted-foreground">
              ก่อนหน้า {previousText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function DeltaChip({
  delta,
  higherIsBetter = true,
}: {
  delta: number | null;
  higherIsBetter?: boolean;
}) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
        ใหม่
      </span>
    );
  }
  const flat = Math.abs(delta) < 0.005;
  const good = flat ? null : delta > 0 === higherIsBetter;
  const Icon = flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
        good === null && "bg-muted text-muted-foreground",
        good === true &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        good === false && "bg-red-500/10 text-red-700 dark:text-red-400",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>
        {flat
          ? "เท่าเดิม"
          : `${delta > 0 ? "+" : "−"}${fmtPercent(Math.abs(delta))}`}
      </span>
    </span>
  );
}

export function SectionTitle({
  icon,
  title,
  description,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
          {icon}
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

export function Panel({
  title,
  description,
  right,
  children,
  className,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
