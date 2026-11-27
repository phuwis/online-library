"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Globe,
  Laptop,
  Loader2,
  Monitor,
  ShieldCheck,
  Smartphone,
  Tablet,
  Table2,
  LineChart,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type {
  DashboardData,
  SeriesPoint,
} from "@/features/analytics/dashboard-types";
import {
  DEFAULT_PRESET,
  GRANULARITIES,
  bucketLabel,
  formatThaiRange,
  type GranularityOption,
  type RangePreset,
} from "@/features/analytics/range";
import {
  BarList,
  ChartLegend,
  Heatmap,
  MiniMeter,
  SplitBar,
  TrendChart,
} from "./charts";
import { Kpi, Panel, SectionTitle } from "./kpi";
import { RangeControls, type RangeState } from "./range-controls";
import { SiteTotalsBand } from "./site-totals";
import { CategoryTable } from "./category-table";
import {
  fmtDecimal,
  fmtDuration,
  fmtNumber,
  fmtPercent,
  safeRatio,
} from "./format";

// ───────────── สีของกราฟ (ผ่านการตรวจ contrast / ตาบอดสีแล้ว ทั้งสองโหมด) ─────────────
const VIZ_STYLE = `
.viz-root {
  --viz-1: #7322c3;
  --viz-2: #0f9488;
  --viz-prev: #8a8a8a;
  --viz-surface: #ffffff;
  --viz-empty: #f1f1f3;
  --viz-grid: #e7e7ea;
  --viz-axis: #a1a1aa;
}
.dark .viz-root {
  --viz-1: #a47bf0;
  --viz-2: #2bb5a3;
  --viz-prev: #8f8f8f;
  --viz-surface: #171717;
  --viz-empty: #262626;
  --viz-grid: #2e2e2e;
  --viz-axis: #6b6b6b;
}`;

type MetricKey =
  | "visitors"
  | "pageviews"
  | "readingSessions"
  | "readingSec"
  | "readers";

const METRICS: Array<{
  key: MetricKey;
  label: string;
  unit: string;
  get: (p: SeriesPoint) => number;
  format: (n: number) => string;
  axis?: (n: number) => string;
}> = [
  {
    key: "visitors",
    label: "ผู้เข้าชม",
    unit: "คน",
    get: (p) => p.visitors,
    format: (n) => `${fmtNumber(n)} คน`,
  },
  {
    key: "pageviews",
    label: "หน้าที่เปิดดู",
    unit: "หน้า",
    get: (p) => p.pageviews,
    format: (n) => `${fmtNumber(n)} หน้า`,
  },
  {
    key: "readingSessions",
    label: "ครั้งที่เปิดอ่าน",
    unit: "ครั้ง",
    get: (p) => p.readingSessions,
    format: (n) => `${fmtNumber(n)} ครั้ง`,
  },
  {
    key: "readingSec",
    label: "เวลาอ่าน",
    unit: "นาที",
    get: (p) => p.readingSec / 60,
    format: (n) => fmtDuration(n * 60),
    axis: (n) => (n >= 120 ? `${fmtDecimal(n / 60)}ชม.` : `${Math.round(n)}น.`),
  },
  {
    key: "readers",
    label: "ผู้อ่าน",
    unit: "คน",
    get: (p) => p.readers,
    format: (n) => `${fmtNumber(n)} คน`,
  },
];

const DEVICE_META = {
  MOBILE: { label: "มือถือ", icon: Smartphone },
  TABLET: { label: "แท็บเล็ต", icon: Tablet },
  DESKTOP: { label: "คอมพิวเตอร์", icon: Monitor },
} as const;

function readState(sp: URLSearchParams): RangeState {
  return {
    range: (sp.get("range") as RangePreset) || DEFAULT_PRESET,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    granularity: (sp.get("granularity") as GranularityOption) || "auto",
    compare: sp.get("compare") !== "0",
  };
}

function toQuery(s: RangeState): string {
  const p = new URLSearchParams();
  if (s.range !== DEFAULT_PRESET) p.set("range", s.range);
  if (s.range === "custom" && s.from && s.to) {
    p.set("from", s.from);
    p.set("to", s.to);
  }
  if (s.granularity !== "auto") p.set("granularity", s.granularity);
  if (!s.compare) p.set("compare", "0");
  return p.toString();
}

export function DashboardClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state = useMemo(
    () => readState(new URLSearchParams(sp.toString())),
    [sp],
  );
  const query = toQuery(state);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [metric, setMetric] = useState<MetricKey>("visitors");
  const [heatMode, setHeatMode] = useState<"pageviews" | "readingSec">(
    "pageviews",
  );
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/dashboard/stats?${query}`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success)
          throw new Error(json?.error || `HTTP ${res.status}`);
        setData(json.data as DashboardData);
        setError(null);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError")
          setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [query, reloadKey]);

  const update = (next: RangeState) => {
    const q = toQuery(next);
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const range = data?.range ?? null;
  const metricDef = METRICS.find((m) => m.key === metric)!;

  const trend = useMemo(() => {
    if (!data) return null;
    const r = data.range;
    const cur = data.series.map((p) => {
      const l = bucketLabel(p.key, r.granularity, r);
      return { label: l.short, long: l.long, value: metricDef.get(p) };
    });
    const prev =
      data.previousSeries?.map((p) => {
        const l = bucketLabel(p.key, r.granularity, {
          from: r.prevFrom,
          to: r.prevTo,
        });
        return { label: l.short, long: l.long, value: metricDef.get(p) };
      }) ?? null;
    return { cur, prev };
  }, [data, metricDef]);

  const adminTrend = useMemo(() => {
    if (!data) return null;
    const r = data.range;
    return {
      cur: data.series.map((p) => {
        const l = bucketLabel(p.key, r.granularity, r);
        return { label: l.short, long: l.long, value: p.adminSessions };
      }),
      prev:
        data.previousSeries?.map((p) => {
          const l = bucketLabel(p.key, r.granularity, {
            from: r.prevFrom,
            to: r.prevTo,
          });
          return { label: l.short, long: l.long, value: p.adminSessions };
        }) ?? null,
    };
  }, [data]);

  // ───────── สถานะโหลดครั้งแรก / ผิดพลาด ─────────
  if (!data) {
    return (
      <div className="viz-root space-y-6">
        <style>{VIZ_STYLE}</style>
        <Header
          state={state}
          data={null}
          loading={loading}
          onChange={update}
          onRefresh={() => setReloadKey((k) => k + 1)}
        />
        {error ? (
          <ErrorBox
            message={error}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        ) : (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border/80">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  const s = data.summary;
  const prev = data.previous;
  const r = data.range;
  const prevRangeLabel = formatThaiRange(r.prevFrom, r.prevTo);
  const granLabel =
    GRANULARITIES.find((g) => g.value === r.granularity)?.label ?? "";

  return (
    <div className="viz-root space-y-8">
      <style>{VIZ_STYLE}</style>
      <Header
        state={state}
        data={data}
        loading={loading}
        onChange={update}
        onRefresh={() => setReloadKey((k) => k + 1)}
      />

      {error && (
        <ErrorBox message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      <div
        className={cn("space-y-8 transition-opacity", loading && "opacity-60")}
      >
        {/* ───────── หน้าบ้าน ───────── */}
        <section className="space-y-4">
          <SectionTitle
            icon={<Globe className="size-5 text-muted-foreground" />}
            title="ผู้เข้าใช้งานเว็บไซต์ (หน้าบ้าน)"
            description="นับจากเบราว์เซอร์/อุปกรณ์ที่เข้าชม ไม่รวมบอทและไม่เก็บข้อมูลส่วนบุคคล"
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Kpi
              label="ผู้เข้าชม"
              value={`${fmtNumber(s.public.visitors)} คน`}
              current={s.public.visitors}
              previous={prev?.public.visitors}
              previousText={prev ? fmtNumber(prev.public.visitors) : undefined}
              sub={`ใหม่ ${fmtNumber(s.newVisitors)} · กลับมา ${fmtNumber(s.returningVisitors)}`}
              hint="จำนวนเบราว์เซอร์/อุปกรณ์ที่ไม่ซ้ำกันที่เข้ามาในช่วงนี้"
            />
            <Kpi
              label="การเข้าใช้งาน"
              value={`${fmtNumber(s.public.sessions)} ครั้ง`}
              current={s.public.sessions}
              previous={prev?.public.sessions}
              previousText={prev ? fmtNumber(prev.public.sessions) : undefined}
              hint="1 ครั้ง = เข้ามาใช้งานต่อเนื่อง (ห่างกันไม่เกิน 30 นาที)"
            />
            <Kpi
              label="หน้าที่เปิดดู"
              value={fmtNumber(s.public.pageviews)}
              current={s.public.pageviews}
              previous={prev?.public.pageviews}
              previousText={prev ? fmtNumber(prev.public.pageviews) : undefined}
            />
            <Kpi
              label="หน้าต่อการเข้าใช้"
              value={fmtDecimal(
                safeRatio(s.public.pageviews, s.public.sessions),
              )}
              current={safeRatio(s.public.pageviews, s.public.sessions)}
              previous={
                prev
                  ? safeRatio(prev.public.pageviews, prev.public.sessions)
                  : null
              }
              previousText={
                prev
                  ? fmtDecimal(
                      safeRatio(prev.public.pageviews, prev.public.sessions),
                    )
                  : undefined
              }
              hint="จำนวนหน้าเฉลี่ยที่เปิดดูต่อการเข้าใช้ 1 ครั้ง"
            />
            <Kpi
              label="ออกหลังดูหน้าเดียว"
              value={fmtPercent(safeRatio(s.public.bounces, s.public.sessions))}
              current={safeRatio(s.public.bounces, s.public.sessions)}
              previous={
                prev
                  ? safeRatio(prev.public.bounces, prev.public.sessions)
                  : null
              }
              previousText={
                prev
                  ? fmtPercent(
                      safeRatio(prev.public.bounces, prev.public.sessions),
                    )
                  : undefined
              }
              higherIsBetter={false}
              hint="สัดส่วนการเข้าใช้ที่เปิดเพียง 1 หน้าแล้วออก (ยิ่งน้อยยิ่งดี)"
            />
          </div>
        </section>

        {/* ───────── การอ่าน ───────── */}
        <section className="space-y-4">
          <SectionTitle
            icon={<BookOpen className="size-5 text-muted-foreground" />}
            title="การอ่านหนังสือ"
            description="นับเฉพาะการเปิดอ่านที่มีเวลาอ่านจริงอย่างน้อย 1 วินาที"
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Kpi
              label="ครั้งที่เปิดอ่าน"
              value={`${fmtNumber(s.reading.sessions)} ครั้ง`}
              current={s.reading.sessions}
              previous={prev?.reading.sessions}
              previousText={prev ? fmtNumber(prev.reading.sessions) : undefined}
              sub={`จาก ${fmtNumber(s.reading.booksRead)} เล่ม`}
            />
            <Kpi
              label="ผู้อ่าน"
              value={`${fmtNumber(s.reading.readers)} คน`}
              current={s.reading.readers}
              previous={prev?.reading.readers}
              previousText={prev ? fmtNumber(prev.reading.readers) : undefined}
              hint="นับตามเบราว์เซอร์/อุปกรณ์ที่เปิดอ่าน"
            />
            <Kpi
              label="เวลาอ่านรวม"
              value={fmtDuration(s.reading.totalSec)}
              current={s.reading.totalSec}
              previous={prev?.reading.totalSec}
              previousText={
                prev ? fmtDuration(prev.reading.totalSec) : undefined
              }
            />
            <Kpi
              label="เวลาอ่านเฉลี่ยต่อครั้ง"
              value={fmtDuration(
                safeRatio(s.reading.totalSec, s.reading.sessions),
              )}
              current={safeRatio(s.reading.totalSec, s.reading.sessions)}
              previous={
                prev
                  ? safeRatio(prev.reading.totalSec, prev.reading.sessions)
                  : null
              }
              previousText={
                prev
                  ? fmtDuration(
                      safeRatio(prev.reading.totalSec, prev.reading.sessions),
                    )
                  : undefined
              }
            />
            <Kpi
              label="อ่านจบ"
              value={fmtPercent(
                safeRatio(s.reading.finishes, s.reading.sessions),
              )}
              current={safeRatio(s.reading.finishes, s.reading.sessions)}
              previous={
                prev
                  ? safeRatio(prev.reading.finishes, prev.reading.sessions)
                  : null
              }
              previousText={
                prev
                  ? fmtPercent(
                      safeRatio(prev.reading.finishes, prev.reading.sessions),
                    )
                  : undefined
              }
              sub={`${fmtNumber(s.reading.finishes)} ครั้ง · อ่านไปเฉลี่ย ${fmtPercent(s.reading.avgPercent)}`}
              hint="สัดส่วนครั้งที่อ่านถึง 98% ของเล่มขึ้นไป"
            />
          </div>
        </section>

        {/* ───────── แนวโน้ม ───────── */}
        <Panel
          title={`แนวโน้ม${metricDef.label} (${granLabel})`}
          description={r.compare ? `เส้นประ = ${prevRangeLabel}` : r.title}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap rounded-lg border border-border/80 p-0.5">
                {METRICS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMetric(m.key)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      metric === m.key
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAsTable((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-border/80 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {asTable ? (
                  <LineChart className="size-3.5" />
                ) : (
                  <Table2 className="size-3.5" />
                )}
                {asTable ? "กราฟ" : "ตาราง"}
              </button>
            </div>
          }
        >
          {trend &&
            (asTable ? (
              <div className="max-h-72 overflow-auto rounded-lg border border-border/60">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr className="text-muted-foreground">
                      <th className="px-3 py-2 font-medium">ช่วงเวลา</th>
                      <th className="px-3 py-2 text-right font-medium">
                        {metricDef.label}
                      </th>
                      {trend.prev && (
                        <th className="px-3 py-2 text-right font-medium">
                          ช่วงก่อนหน้า
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 tabular-nums">
                    {trend.cur.map((d, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5">{d.long}</td>
                        <td className="px-3 py-1.5 text-right font-semibold">
                          {metricDef.format(d.value)}
                        </td>
                        {trend.prev && (
                          <td className="px-3 py-1.5 text-right text-muted-foreground">
                            {trend.prev[i]
                              ? metricDef.format(trend.prev[i]!.value)
                              : "–"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <TrendChart
                  data={trend.cur}
                  previous={trend.prev}
                  format={metricDef.format}
                  axisFormat={metricDef.axis}
                  currentLabel="ช่วงที่เลือก"
                  previousLabel="ช่วงก่อนหน้า"
                  ariaLabel={`กราฟ${metricDef.label} ${r.title}`}
                />
                <ChartLegend
                  compare={!!trend.prev}
                  currentLabel={r.title}
                  previousLabel={prevRangeLabel}
                />
              </>
            ))}
        </Panel>

        {/* ───────── ช่วงเวลา + ผู้เข้าชมใหม่ ───────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="ช่วงวันและเวลาที่มีการใช้งาน"
            description="รวมทุกสัปดาห์ในช่วงที่เลือก (เวลาประเทศไทย)"
            right={
              <div className="flex rounded-lg border border-border/80 p-0.5">
                {(
                  [
                    ["pageviews", "การเข้าชม"],
                    ["readingSec", "เวลาอ่าน"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setHeatMode(k)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium",
                      heatMode === k
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            {heatMode === "pageviews" ? (
              <Heatmap
                grid={data.heatmap.pageviews}
                format={fmtNumber}
                unit="หน้า"
              />
            ) : (
              <Heatmap
                grid={data.heatmap.readingSec}
                format={(n) => fmtDuration(n)}
                unit=""
              />
            )}
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel
              title="ผู้เข้าชมใหม่ / กลับมาใช้ซ้ำ"
              description="ใหม่ = เข้าเว็บไซต์ครั้งแรกในช่วงนี้"
            >
              <SplitBar
                parts={[
                  { label: "ผู้เข้าชมใหม่", value: s.newVisitors },
                  { label: "กลับมาใช้ซ้ำ", value: s.returningVisitors },
                ]}
              />
            </Panel>
            <Panel title="คลังหนังสือในช่วงนี้">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                <Stat
                  label="เผยแพร่ทั้งหมด"
                  value={`${fmtNumber(s.catalog.published)} เล่ม`}
                />
                <Stat
                  label="มีคนอ่าน"
                  value={`${fmtNumber(s.reading.booksRead)} เล่ม`}
                />
                <Stat
                  label="ยังไม่มีคนอ่าน"
                  value={`${fmtNumber(s.catalog.unreadPublished)} เล่ม`}
                />
                <Stat
                  label="เพิ่มเข้าคลัง"
                  value={`${fmtNumber(s.catalog.addedInRange)} เล่ม`}
                />
              </dl>
            </Panel>
          </div>
        </div>

        {/* ───────── อุปกรณ์ / ที่มา / หน้า ───────── */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Panel
            title="อุปกรณ์ที่ใช้เข้าชม"
            description="นับเป็นจำนวนผู้เข้าชม"
          >
            <BarList
              items={(["MOBILE", "DESKTOP", "TABLET"] as const).map((k) => {
                const Icon = DEVICE_META[k].icon;
                return {
                  key: k,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="size-3.5 text-muted-foreground" />
                      {DEVICE_META[k].label}
                    </span>
                  ),
                  value: data.devices.public[k].visitors,
                };
              })}
            />
          </Panel>
          <Panel
            title="ช่องทางที่เข้ามา"
            description="นับเป็นจำนวนการเข้าใช้งาน"
          >
            <BarList
              items={data.sources.map((x) => ({
                key: x.label,
                label: x.label,
                value: x.sessions,
              }))}
            />
          </Panel>
          <Panel
            title="หน้าที่มีผู้เข้าชมมากที่สุด"
            description="จำนวนครั้งที่เปิดหน้า · (จำนวนคน)"
            className="md:col-span-2 xl:col-span-1"
          >
            <BarList
              showShare={false}
              items={data.topPages.map((p) => ({
                key: p.path,
                label: p.label,
                sub: `(${fmtNumber(p.visitors)} คน)`,
                value: p.pageviews,
              }))}
            />
          </Panel>
        </div>

        {/* ───────── หมวดหมู่ของห้องสมุด ───────── */}
        <Panel
          title="สถิติการเข้าชมตามหมวดหมู่ของห้องสมุด"
          description="หมวดหมู่ที่สร้างในระบบ · นับเมื่อเลือกหมวดในหน้าหนังสือทั้งหมด หรือเปิดหนังสือที่อยู่ในหมวด"
        >
          <CategoryTable rows={data.categories} compare={r.compare} />
        </Panel>

        {/* ───────── หนังสือยอดนิยม ───────── */}
        <Panel
          title="หนังสือที่มีการอ่านมากที่สุด"
          description="เรียงตามจำนวนครั้งที่เปิดอ่าน · อ่านไปเฉลี่ย = ตำแหน่งไกลสุดที่อ่านถึงต่อครั้ง"
        >
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-y border-border/60 bg-muted/30 text-xs text-muted-foreground">
                  <th className="w-10 px-4 py-2.5 font-medium sm:px-5">#</th>
                  <th className="px-2 py-2.5 font-medium">ชื่อหนังสือ</th>
                  <th className="px-2 py-2.5 text-right font-medium">
                    เปิดอ่าน
                  </th>
                  <th className="px-2 py-2.5 text-right font-medium">
                    ผู้อ่าน
                  </th>
                  <th className="px-2 py-2.5 text-right font-medium">
                    เวลารวม
                  </th>
                  <th className="px-2 py-2.5 text-right font-medium">
                    เฉลี่ย/ครั้ง
                  </th>
                  <th className="px-2 py-2.5 font-medium">อ่านไปเฉลี่ย</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                    อ่านจบ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.topBooks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-xs text-muted-foreground"
                    >
                      ยังไม่มีการอ่านในช่วงนี้
                    </td>
                  </tr>
                ) : (
                  data.topBooks.map((b, i) => (
                    <tr key={b.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground sm:px-5">
                        {i + 1}
                      </td>
                      <td className="max-w-[320px] px-2 py-3">
                        <Link
                          href={`/books/${b.slug}`}
                          target="_blank"
                          className="line-clamp-2 font-medium text-foreground hover:underline"
                          title={b.title}
                        >
                          {b.title}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {b.author}
                        </p>
                      </td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums">
                        {fmtNumber(b.sessions)}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums">
                        {fmtNumber(b.readers)}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">
                        {fmtDuration(b.totalSec)}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">
                        {fmtDuration(safeRatio(b.totalSec, b.sessions))}
                      </td>
                      <td className="px-2 py-3">
                        <MiniMeter value={b.avgPercent} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums sm:px-5">
                        {fmtNumber(b.finishes)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({fmtPercent(safeRatio(b.finishes, b.sessions))})
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="การอ่านตามหมวดหมู่ (DDC)"
            description="จำนวนครั้งที่เปิดอ่าน · (จำนวนเล่มที่มีคนอ่าน)"
          >
            <BarList
              items={data.ddc
                .filter((d) => d.sessions > 0)
                .sort((a, b) => b.sessions - a.sessions)
                .map((d) => ({
                  key: d.ddc,
                  label: `${d.code} ${d.label}`,
                  sub: `(${fmtNumber(d.books)} เล่ม)`,
                  value: d.sessions,
                }))}
              empty="ยังไม่มีการอ่านในช่วงนี้"
            />
          </Panel>
          <Panel
            title="หน้ารายละเอียดหนังสือที่ถูกเปิดดูมากที่สุด"
            description="ความสนใจก่อนเปิดอ่าน · (จำนวนคน)"
          >
            <BarList
              showShare={false}
              items={data.topBookPages.map((b) => ({
                key: b.slug,
                label: b.title,
                sub: `(${fmtNumber(b.visitors)} คน)`,
                value: b.pageviews,
              }))}
            />
          </Panel>
        </div>

        {/* ───────── หลังบ้าน ───────── */}
        <section className="space-y-4">
          <SectionTitle
            icon={<ShieldCheck className="size-5 text-muted-foreground" />}
            title="การใช้งานฝั่งผู้ดูแลระบบ (หลังบ้าน)"
            description="รวมหน้าเข้าสู่ระบบและทุกหน้าใน /dashboard (รวมการเปิดหน้านี้ด้วย)"
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Kpi
              label="การเข้าใช้หลังบ้าน"
              value={`${fmtNumber(s.admin.sessions)} ครั้ง`}
              current={s.admin.sessions}
              previous={prev?.admin.sessions}
              previousText={prev ? fmtNumber(prev.admin.sessions) : undefined}
            />
            <Kpi
              label="หน้าที่เปิดในหลังบ้าน"
              value={fmtNumber(s.admin.pageviews)}
              current={s.admin.pageviews}
              previous={prev?.admin.pageviews}
              previousText={prev ? fmtNumber(prev.admin.pageviews) : undefined}
            />
            <Kpi
              label="อุปกรณ์ที่เข้าหลังบ้าน"
              value={`${fmtNumber(s.admin.visitors)} เครื่อง`}
              current={s.admin.visitors}
              previous={prev?.admin.visitors}
              previousText={prev ? fmtNumber(prev.admin.visitors) : undefined}
              sub={
                (["DESKTOP", "MOBILE", "TABLET"] as const)
                  .filter((k) => data.devices.admin[k].visitors > 0)
                  .map(
                    (k) =>
                      `${DEVICE_META[k].label} ${data.devices.admin[k].visitors}`,
                  )
                  .join(" · ") || undefined
              }
              hint="นับตามเบราว์เซอร์ (ระบบใช้รหัสผ่านผู้ดูแลร่วมกัน จึงแยกรายบุคคลไม่ได้)"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              className="lg:col-span-2"
              title={`การเข้าใช้หลังบ้าน (${granLabel})`}
            >
              {adminTrend && (
                <>
                  <TrendChart
                    data={adminTrend.cur}
                    previous={adminTrend.prev}
                    height={180}
                    format={(n) => `${fmtNumber(n)} ครั้ง`}
                    currentLabel={r.title}
                    ariaLabel={`กราฟการเข้าใช้หลังบ้าน ${r.title}`}
                  />
                  <ChartLegend
                    compare={!!adminTrend.prev}
                    currentLabel={r.title}
                    previousLabel={prevRangeLabel}
                  />
                </>
              )}
            </Panel>
            <Panel title="ส่วนที่ใช้งาน" description="จำนวนหน้าที่เปิด">
              <BarList
                items={data.adminSections.map((x) => ({
                  key: x.section,
                  label: x.label,
                  value: x.pageviews,
                }))}
              />
            </Panel>
          </div>
        </section>

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Laptop className="mt-0.5 size-3.5 shrink-0" />
          ผู้เข้าชม/ผู้อ่านนับตามเบราว์เซอร์
          (ล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่อง = นับเป็นคนใหม่) ·
          วันและเวลาตามเวลาประเทศไทย ·
          จำนวนผู้อ่านเริ่มนับตั้งแต่อัปเดตระบบเก็บสถิติชุดนี้ · ข้อมูล ณ{" "}
          {new Date(data.generatedAt).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          น.
        </p>
      </div>
    </div>
  );
}

function Header({
  state,
  data,
  loading,
  onChange,
  onRefresh,
}: {
  state: RangeState;
  data: DashboardData | null;
  loading: boolean;
  onChange: (s: RangeState) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ภาพรวมและสถิติ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          การเข้าใช้งานเว็บไซต์และการอ่านหนังสือ
        </p>
      </div>

      {/* ยอดสะสม (ไม่ขึ้นกับตัวกรอง) */}
      {data && <SiteTotalsBand totals={data.totals} />}

      {/* ตัวกรองช่วงเวลา: มีผลกับทุกส่วนด้านล่าง */}
      <div className="flex flex-col gap-3 border-t border-border/60 pt-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            สถิติตามช่วงเวลา
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data ? (
              <>
                {data.range.title}
                {data.range.preset === "fiscal-year" &&
                  ` (${formatThaiRange(data.range.from, data.range.to)})`}{" "}
                · {fmtNumber(data.range.days)} วัน
              </>
            ) : (
              "กำลังโหลด…"
            )}
          </p>
        </div>
        <RangeControls
          state={state}
          resolved={data?.range ?? null}
          onChange={onChange}
          onRefresh={onRefresh}
          refreshing={loading}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
      <span className="flex items-center gap-2 text-red-700 dark:text-red-400">
        <AlertCircle className="size-4" />
        โหลดสถิติไม่สำเร็จ: {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        ลองใหม่
      </button>
    </div>
  );
}
