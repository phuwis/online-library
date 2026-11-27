"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  GRANULARITIES,
  RANGE_PRESETS,
  type GranularityOption,
  type RangePreset,
  type ResolvedRange,
} from "@/features/analytics/range";

export type RangeState = {
  range: RangePreset;
  from?: string;
  to?: string;
  granularity: GranularityOption;
  compare: boolean;
};

const QUICK: RangePreset[] = ["today", "7d", "30d", "fiscal-year"];

export function RangeControls({
  state,
  resolved,
  onChange,
  onRefresh,
  refreshing,
}: {
  state: RangeState;
  resolved: ResolvedRange | null;
  onChange: (next: RangeState) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(resolved?.from ?? "");
  const [draftTo, setDraftTo] = useState(resolved?.to ?? "");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(resolved?.from ?? "");
    setDraftTo(resolved?.to ?? "");
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, resolved?.from, resolved?.to]);

  const presetLabel =
    RANGE_PRESETS.find((p) => p.value === state.range)?.label ?? "ช่วงเวลา";
  const allowed = resolved?.allowedGranularities ?? [];
  const customValid = draftFrom && draftTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ปุ่มลัด */}
      <div className="hidden items-center rounded-xl border border-border/80 bg-card p-1 shadow-sm lg:flex">
        {QUICK.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() =>
              onChange({ ...state, range: p, from: undefined, to: undefined })
            }
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              state.range === p
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {RANGE_PRESETS.find((x) => x.value === p)!.label}
          </button>
        ))}
      </div>

      {/* ตัวเลือกช่วงเวลาทั้งหมด */}
      <div className="relative" ref={boxRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted/50"
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-xs font-semibold text-foreground">
              {presetLabel}
            </span>
            {resolved && (
              <span className="truncate text-[11px] text-muted-foreground">
                {resolved.title}
              </span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl sm:left-auto sm:right-0">
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {RANGE_PRESETS.filter((p) => p.value !== "custom").map((p) => {
                const selected = state.range === p.value;
                return (
                  <li key={p.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          ...state,
                          range: p.value,
                          from: undefined,
                          to: undefined,
                        });
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/60"
                    >
                      <span className={cn(selected && "font-semibold")}>
                        {p.label}
                      </span>
                      {selected && <Check className="size-4" strokeWidth={3} />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2 border-t border-border p-3">
              <p className="text-xs font-semibold text-foreground">
                กำหนดช่วงเอง
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-[11px] text-muted-foreground">
                  ตั้งแต่
                  <input
                    type="date"
                    value={draftFrom}
                    max={draftTo || resolved?.today}
                    onChange={(e) => setDraftFrom(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                  />
                </label>
                <label className="space-y-1 text-[11px] text-muted-foreground">
                  ถึง
                  <input
                    type="date"
                    value={draftTo}
                    min={draftFrom}
                    max={resolved?.today}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={!customValid}
                onClick={() => {
                  onChange({
                    ...state,
                    range: "custom",
                    from: draftFrom,
                    to: draftTo,
                  });
                  setOpen(false);
                }}
                className="w-full rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background transition-opacity disabled:opacity-40"
              >
                ใช้ช่วงนี้
              </button>
              <p className="text-[10px] text-muted-foreground">
                เลือกได้สูงสุดประมาณ 3 ปี · วันที่ตามเวลาประเทศไทย
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ความละเอียดของกราฟ */}
      <label className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs shadow-sm">
        <span className="text-muted-foreground">แสดง</span>
        <select
          value={state.granularity}
          onChange={(e) =>
            onChange({
              ...state,
              granularity: e.target.value as GranularityOption,
            })
          }
          className="cursor-pointer bg-transparent font-semibold text-foreground focus:outline-none"
        >
          {GRANULARITIES.map((g) => (
            <option
              key={g.value}
              value={g.value}
              disabled={g.value !== "auto" && !allowed.includes(g.value)}
              className="bg-card text-foreground"
            >
              {g.value === "auto" && resolved && state.granularity === "auto"
                ? `อัตโนมัติ (${GRANULARITIES.find((x) => x.value === resolved.granularity)?.label})`
                : g.label}
            </option>
          ))}
        </select>
      </label>

      {/* เปรียบเทียบ */}
      <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs shadow-sm">
        <span
          className={cn(
            "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
            state.compare ? "bg-foreground" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "absolute size-3 rounded-full bg-background shadow transition-transform",
              state.compare ? "translate-x-3.5" : "translate-x-0.5",
            )}
          />
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={state.compare}
          onChange={(e) => onChange({ ...state, compare: e.target.checked })}
        />
        <span className="font-medium text-foreground">เทียบช่วงก่อนหน้า</span>
      </label>

      <button
        type="button"
        onClick={onRefresh}
        aria-label="โหลดข้อมูลใหม่"
        title="โหลดข้อมูลใหม่"
        className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
      </button>
    </div>
  );
}
