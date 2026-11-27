"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { fmtCompact, fmtNumber, fmtPercent, safeRatio } from "./format";

/**
 * กราฟของ dashboard (SVG/HTML ล้วน ไม่ใช้ไลบรารีเพิ่ม)
 * สีมาจากตัวแปร --viz-* ที่ประกาศใน dashboard-client.tsx (มีทั้งโหมดสว่าง/มืด)
 */

// ───────────── ขนาดของกล่อง ─────────────

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry!.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** ค่าสูงสุดของแกน Y ที่แบ่ง 4 ช่องได้ตัวเลขสวย (ค่าน้อย ๆ จะได้เส้นแบ่งเป็นจำนวนเต็ม) */
function niceMax(value: number): number {
  const rough = value / 4;
  if (rough <= 1) return 4;
  const base = 10 ** Math.floor(Math.log10(rough));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    const step = m * base;
    if (base === 1 && !Number.isInteger(step)) continue;
    if (rough <= step) return step * 4;
  }
  return 40 * base;
}

function topRoundedBar(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

// ───────────── กราฟแนวโน้ม ─────────────

export type TrendDatum = { label: string; long: string; value: number };

export function TrendChart({
  data,
  previous,
  previousLabel = "ช่วงก่อนหน้า",
  currentLabel = "ช่วงที่เลือก",
  format = fmtNumber,
  axisFormat = fmtCompact,
  height = 260,
  ariaLabel,
}: {
  data: TrendDatum[];
  previous?: TrendDatum[] | null;
  previousLabel?: string;
  currentLabel?: string;
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  height?: number;
  ariaLabel: string;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const gradId = useId();

  const n = data.length;
  const m = { top: 12, right: 8, bottom: 28, left: 44 };
  const innerW = Math.max(0, width - m.left - m.right);
  const innerH = height - m.top - m.bottom;
  const band = n > 0 ? innerW / n : 0;
  const asBars = n <= 45;

  const max = useMemo(() => {
    const all = data.map((d) => d.value);
    if (previous) all.push(...previous.slice(0, n).map((d) => d.value));
    return niceMax(Math.max(0, ...all));
  }, [data, previous, n]);

  const y = (v: number) => m.top + innerH - (v / max) * innerH;
  const cx = (i: number) => m.left + band * i + band / 2;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.max(
    1,
    Math.ceil(n / Math.max(1, Math.floor(innerW / 72))),
  );

  const linePath = (vals: TrendDatum[]) =>
    vals
      .slice(0, n)
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)},${y(d.value).toFixed(1)}`,
      )
      .join("");
  const areaPath = n
    ? `${linePath(data)}L${cx(n - 1).toFixed(1)},${y(0)}L${cx(0).toFixed(1)},${y(0)}Z`
    : "";

  const barW = Math.max(2, Math.min(28, band - Math.max(2, band * 0.3)));

  const pick = (clientX: number, rect: DOMRect) => {
    if (!n || band <= 0) return;
    const i = Math.floor((clientX - rect.left - m.left) / band);
    setActive(i < 0 || i >= n ? null : i);
  };

  const cur = active !== null ? data[active] : null;
  const prev = active !== null && previous ? previous[active] : null;
  const tipLeft = active !== null ? cx(active) : 0;
  const flip = tipLeft > width * 0.6;

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
          onPointerMove={(e) =>
            pick(e.clientX, e.currentTarget.getBoundingClientRect())
          }
          onPointerDown={(e) =>
            pick(e.clientX, e.currentTarget.getBoundingClientRect())
          }
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight")
              setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
            if (e.key === "ArrowLeft")
              setActive((a) => Math.max(0, (a ?? n) - 1));
            if (e.key === "Escape") setActive(null);
          }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-1)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--viz-1)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* grid + แกน Y */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={m.left}
                x2={width - m.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--viz-grid)"
                strokeDasharray={t === 0 ? undefined : "2 4"}
              />
              <text
                x={m.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {axisFormat(t)}
              </text>
            </g>
          ))}

          {/* ข้อมูลช่วงที่เลือก */}
          {asBars ? (
            data.map((d, i) => {
              const h = y(0) - y(d.value);
              return (
                <path
                  key={i}
                  d={topRoundedBar(cx(i) - barW / 2, y(d.value), barW, h, 4)}
                  fill="var(--viz-1)"
                  opacity={active === null || active === i ? 1 : 0.55}
                />
              );
            })
          ) : (
            <>
              <path d={areaPath} fill={`url(#${gradId})`} />
              <path
                d={linePath(data)}
                fill="none"
                stroke="var(--viz-1)"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </>
          )}

          {/* ช่วงก่อนหน้า (เส้นประ) */}
          {previous && previous.length > 0 && (
            <path
              d={linePath(previous)}
              fill="none"
              stroke="var(--viz-prev)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              strokeLinejoin="round"
            />
          )}

          {/* crosshair */}
          {active !== null && (
            <g pointerEvents="none">
              <line
                x1={cx(active)}
                x2={cx(active)}
                y1={m.top}
                y2={y(0)}
                stroke="var(--viz-axis)"
                strokeWidth={1}
              />
              {!asBars && (
                <circle
                  cx={cx(active)}
                  cy={y(data[active]!.value)}
                  r={4.5}
                  fill="var(--viz-1)"
                  stroke="var(--viz-surface)"
                  strokeWidth={2}
                />
              )}
            </g>
          )}

          {/* แกน X */}
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text
                key={i}
                x={cx(i)}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {d.label}
              </text>
            ) : null,
          )}
        </svg>
      )}

      {cur && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-40 max-w-64 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
          style={
            flip ? { right: width - tipLeft + 10 } : { left: tipLeft + 10 }
          }
        >
          <p className="mb-1.5 font-medium text-muted-foreground">{cur.long}</p>
          <TipRow
            color="var(--viz-1)"
            value={format(cur.value)}
            label={currentLabel}
          />
          {prev && (
            <>
              <TipRow
                color="var(--viz-prev)"
                dashed
                value={format(prev.value)}
                label={`${previousLabel} · ${prev.long}`}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TipRow({
  color,
  value,
  label,
  dashed,
}: {
  color: string;
  value: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <svg width="14" height="10" className="mt-1 shrink-0" aria-hidden>
        <line
          x1="0"
          x2="14"
          y1="5"
          y2="5"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? "4 3" : undefined}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {value}
        </p>
        <p className="text-[11px] leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export function ChartLegend({
  compare,
  currentLabel,
  previousLabel,
}: {
  compare: boolean;
  currentLabel: string;
  previousLabel: string;
}) {
  if (!compare) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-3.5 rounded-sm"
          style={{ background: "var(--viz-1)" }}
        />
        {currentLabel}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="18" height="8" aria-hidden>
          <line
            x1="0"
            x2="18"
            y1="4"
            y2="4"
            stroke="var(--viz-prev)"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
        </svg>
        {previousLabel}
      </span>
    </div>
  );
}

// ───────────── Heatmap วัน × ชั่วโมง ─────────────

const DOW = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];
const DOW_SHORT = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

export function Heatmap({
  grid,
  format,
  unit,
}: {
  grid: number[][];
  format: (n: number) => string;
  unit: string;
}) {
  const [active, setActive] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(0, ...grid.flat());
  const peak = useMemo(() => {
    let best = { d: 0, h: 0, v: -1 };
    grid.forEach((row, d) =>
      row.forEach((v, h) => {
        if (v > best.v) best = { d, h, v };
      }),
    );
    return best.v > 0 ? best : null;
  }, [grid]);

  const color = (v: number) =>
    v <= 0
      ? "var(--viz-empty)"
      : `color-mix(in oklab, var(--viz-1) ${Math.round(14 + 86 * (v / max))}%, var(--viz-surface))`;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[2.25rem_repeat(24,minmax(0,1fr))] gap-[2px]">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="text-center text-[9px] text-muted-foreground"
              >
                {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
              </div>
            ))}
            {grid.map((row, d) => (
              <HeatRow
                key={d}
                d={d}
                row={row}
                color={color}
                active={active}
                setActive={setActive}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="min-h-4">
          {active ? (
            <>
              <span className="font-semibold text-foreground">
                {DOW[active.d]} {String(active.h).padStart(2, "0")}:00–
                {String(active.h).padStart(2, "0")}:59 น.
              </span>{" "}
              · {format(grid[active.d]![active.h]!)} {unit}
            </>
          ) : peak ? (
            <>
              ช่วงที่คึกคักที่สุด:{" "}
              <span className="font-semibold text-foreground">
                วัน{DOW[peak.d]} {String(peak.h).padStart(2, "0")}:00–
                {String(peak.h).padStart(2, "0")}:59 น.
              </span>{" "}
              ({format(peak.v)} {unit})
            </>
          ) : (
            "ยังไม่มีข้อมูลในช่วงนี้"
          )}
        </p>
        <div className="flex items-center gap-1.5">
          <span>น้อย</span>
          {[0.15, 0.4, 0.65, 1].map((t) => (
            <span
              key={t}
              className="inline-block size-3 rounded-[3px]"
              style={{
                background: `color-mix(in oklab, var(--viz-1) ${Math.round(14 + 86 * t)}%, var(--viz-surface))`,
              }}
            />
          ))}
          <span>มาก</span>
        </div>
      </div>
    </div>
  );
}

function HeatRow({
  d,
  row,
  color,
  active,
  setActive,
}: {
  d: number;
  row: number[];
  color: (v: number) => string;
  active: { d: number; h: number } | null;
  setActive: (v: { d: number; h: number } | null) => void;
}) {
  return (
    <>
      <div className="flex items-center text-[11px] text-muted-foreground">
        {DOW_SHORT[d]}
      </div>
      {row.map((v, h) => (
        <button
          key={h}
          type="button"
          aria-label={`${DOW[d]} ${h}:00 น. ${fmtNumber(v)}`}
          onPointerEnter={() => setActive({ d, h })}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive({ d, h })}
          onBlur={() => setActive(null)}
          onClick={() => setActive({ d, h })}
          className={cn(
            "h-5 rounded-[3px] outline-none transition-[box-shadow] sm:h-6",
            active?.d === d && active?.h === h && "ring-2 ring-foreground/70",
          )}
          style={{ background: color(v) }}
        />
      ))}
    </>
  );
}

// ───────────── รายการแท่งแนวนอน ─────────────

export function BarList({
  items,
  format = fmtNumber,
  empty = "ยังไม่มีข้อมูล",
  showShare = true,
  valueHeader,
}: {
  items: Array<{
    key: string;
    label: React.ReactNode;
    value: number;
    sub?: string;
    href?: string;
  }>;
  format?: (n: number) => string;
  empty?: string;
  showShare?: boolean;
  valueHeader?: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const max = Math.max(0, ...items.map((i) => i.value));
  if (!items.length || total === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">{empty}</p>
    );
  }
  return (
    <div className="space-y-3">
      {valueHeader && (
        <div className="flex justify-end text-[11px] font-medium text-muted-foreground">
          {valueHeader}
        </div>
      )}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">
                {item.label}
                {item.sub && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {item.sub}
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold text-foreground">
                  {format(item.value)}
                </span>
                {showShare && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {fmtPercent(safeRatio(item.value, total))}
                  </span>
                )}
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full"
              style={{ background: "var(--viz-empty)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, safeRatio(item.value, max) * 100)}%`,
                  background: "var(--viz-1)",
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────────── แท่งแบ่งสัดส่วน 2 ส่วน ─────────────

export function SplitBar({
  parts,
}: {
  parts: [{ label: string; value: number }, { label: string; value: number }];
}) {
  const total = parts[0].value + parts[1].value;
  const share0 = safeRatio(parts[0].value, total);
  const colors = ["var(--viz-1)", "var(--viz-2)"];
  return (
    <div className="space-y-3">
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full"
        style={{ background: "var(--viz-empty)" }}
      >
        {total > 0 &&
          parts.map((p, i) =>
            p.value > 0 ? (
              <div
                key={p.label}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${(i === 0 ? share0 : 1 - share0) * 100}%`,
                  background: colors[i],
                }}
                title={`${p.label}: ${fmtNumber(p.value)}`}
              />
            ) : null,
          )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {parts.map((p, i) => (
          <div key={p.label} className="flex items-start gap-2">
            <span
              className="mt-1 inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: colors[i] }}
            />
            <div>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {fmtNumber(p.value)}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.label} · {fmtPercent(safeRatio(p.value, total))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** แถบความคืบหน้าเล็ก ๆ ในตาราง (0..1) */
export function MiniMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-14 rounded-full"
        style={{ background: "var(--viz-empty)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, value * 100))}%`,
            background: "var(--viz-1)",
          }}
        />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground">
        {fmtPercent(value)}
      </span>
    </div>
  );
}
