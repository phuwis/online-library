"use client";

/**
 * แผงตัวกรองขั้นสูงของหน้า "หนังสือทั้งหมด"
 * - FilterPanel: เนื้อหาตัวกรอง (ใช้ทั้งแถบด้านข้างบนจอกว้าง และในแผ่นเลื่อนบนมือถือ)
 * - FilterSheet: แผ่นเลื่อนจากด้านล่างสำหรับมือถือ/แท็บเล็ต
 * ทุกตัวเลือกแสดงจำนวนเล่มที่จะได้ (นับตามตัวกรองกลุ่มอื่นที่เลือกอยู่)
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  DDC_CLASSES,
  type BookFacets,
  type BookFilters,
  type FacetCount,
} from "@/features/books/filters";

type Patch = Partial<BookFilters>;

export function FilterPanel({
  filters,
  facets,
  onChange,
  disabledReason,
}: {
  filters: BookFilters;
  facets: BookFacets;
  onChange: (patch: Patch) => void;
  /** ถ้ามีค่า: ปิดการใช้งานตัวกรองพร้อมแสดงเหตุผล (เช่น อยู่ในแท็บบุ๊กมาร์ก) */
  disabledReason?: string;
}) {
  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div className="relative space-y-1">
      {disabledReason && (
        <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          {disabledReason}
        </p>
      )}
      <fieldset
        disabled={!!disabledReason}
        className="min-w-0 space-y-1 disabled:opacity-45"
      >
        {/* ประเภทไฟล์ */}
        <Group
          title="ประเภทไฟล์"
          active={!!filters.type}
          onClear={() => onChange({ type: "" })}
        >
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1">
            {[
              {
                value: "",
                label: "ทั้งหมด",
                count: facets.type.reduce((a, b) => a + b.count, 0),
              },
              ...facets.type.map((t) => ({ ...t, label: t.value })),
            ].map((t) => {
              const active = filters.type === t.value;
              return (
                <button
                  key={t.value || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange({ type: t.value as BookFilters["type"] })
                  }
                  disabled={!active && t.value !== "" && t.count === 0}
                  className={`flex flex-col items-center rounded-lg px-1 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-background"
                  }`}
                >
                  {t.label}
                  <span
                    className={`text-[10px] font-medium ${active ? "opacity-80" : "text-muted-foreground"}`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </Group>

        {/* หมวด DDC */}
        <Group
          title="หมวดหมู่ DDC (ดิวอี้)"
          active={filters.ddc.length > 0}
          onClear={() => onChange({ ddc: [] })}
        >
          <ul className="space-y-0.5">
            {facets.ddc.map((f) => {
              const info = DDC_CLASSES.find((d) => d.value === f.value)!;
              const checked = filters.ddc.includes(info.value);
              return (
                <li key={f.value}>
                  <CheckRow
                    checked={checked}
                    count={f.count}
                    onToggle={() =>
                      onChange({ ddc: toggle(filters.ddc, info.value) })
                    }
                  >
                    <span className="mr-1.5 inline-flex w-8 shrink-0 justify-center rounded bg-purple-500/10 py-px font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300">
                      {info.code}
                    </span>
                    <span className="min-w-0 truncate">{info.label}</span>
                  </CheckRow>
                </li>
              );
            })}
          </ul>
        </Group>

        {/* สำนักพิมพ์ */}
        <Group
          title="สำนักพิมพ์ / หน่วยงาน"
          active={filters.publisher.length > 0}
          onClear={() => onChange({ publisher: [] })}
        >
          <FacetList
            items={facets.publisher}
            selected={filters.publisher}
            onToggle={(v) =>
              onChange({ publisher: toggle(filters.publisher, v) })
            }
            searchPlaceholder="ค้นหาสำนักพิมพ์…"
            emptyText="ยังไม่มีข้อมูลสำนักพิมพ์"
          />
        </Group>

        {/* จังหวัด */}
        <Group
          title="จังหวัดที่จัดพิมพ์"
          active={filters.province.length > 0}
          onClear={() => onChange({ province: [] })}
        >
          <FacetList
            items={facets.province}
            selected={filters.province}
            onToggle={(v) =>
              onChange({ province: toggle(filters.province, v) })
            }
            searchPlaceholder="ค้นหาจังหวัด…"
            emptyText="ยังไม่มีข้อมูลจังหวัด"
          />
        </Group>

        {/* ปี */}
        <Group
          title="ปีที่เผยแพร่ในคลัง (พ.ศ.)"
          active={filters.year.length > 0}
          onClear={() => onChange({ year: [] })}
        >
          {facets.year.length === 0 ? (
            <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูลปี</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {facets.year.map((y) => {
                const year = Number(y.value);
                const active = filters.year.includes(year);
                return (
                  <button
                    key={y.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onChange({ year: toggle(filters.year, year) })
                    }
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {y.value}
                    <span
                      className={`text-[10px] ${active ? "opacity-80" : "text-muted-foreground"}`}
                    >
                      {y.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Group>
      </fieldset>
    </div>
  );
}

function Group({
  title,
  active,
  onClear,
  children,
}: {
  title: string;
  active: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-border/60 py-3 last:border-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-bold leading-snug text-foreground"
        >
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
          />
          {title}
          {active && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-primary"
              aria-label="มีตัวกรองที่เลือกอยู่"
            />
          )}
        </button>
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
          >
            ล้าง
          </button>
        )}
      </div>
      {open && children}
    </section>
  );
}

function CheckRow({
  checked,
  count,
  onToggle,
  children,
}: {
  checked: boolean;
  count: number;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const empty = count === 0 && !checked;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      disabled={empty}
      className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-xs transition-colors disabled:cursor-default disabled:opacity-40 ${
        checked
          ? "bg-primary/10 font-semibold text-foreground"
          : "text-foreground/85 hover:bg-muted"
      }`}
    >
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded border ${
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background"
        }`}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="flex min-w-0 flex-1 items-center">{children}</span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {count}
      </span>
    </button>
  );
}

/** รายการตัวเลือกยาวๆ: แสดง 6 อันดับแรก + ค้นหาภายในกลุ่มเมื่อมีมากกว่า 8 รายการ */
function FacetList({
  items,
  selected,
  onToggle,
  searchPlaceholder,
  emptyText,
}: {
  items: FacetCount[];
  selected: string[];
  onToggle: (value: string) => void;
  searchPlaceholder: string;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [term, setTerm] = useState("");

  // ตัวเลือกที่เลือกไว้แต่ไม่มีในผลนับ (เช่น จากลิงก์เก่า) ให้ยังแสดงเพื่อเอาออกได้
  const merged = [
    ...items,
    ...selected
      .filter((s) => !items.some((i) => i.value === s))
      .map((value) => ({ value, count: 0 })),
  ];
  if (merged.length === 0)
    return <p className="text-xs text-muted-foreground">{emptyText}</p>;

  const filtered = term
    ? merged.filter((i) => i.value.toLowerCase().includes(term.toLowerCase()))
    : merged;
  // เลือกไว้แล้วขึ้นก่อนเสมอ
  const sorted = [...filtered].sort(
    (a, b) =>
      Number(selected.includes(b.value)) - Number(selected.includes(a.value)),
  );
  const visible = expanded || term ? sorted : sorted.slice(0, 6);

  return (
    <div className="space-y-2">
      {merged.length > 8 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-xs outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
          />
        </div>
      )}
      <ul className="space-y-0.5">
        {visible.map((i) => (
          <li key={i.value}>
            <CheckRow
              checked={selected.includes(i.value)}
              count={i.count}
              onToggle={() => onToggle(i.value)}
            >
              <span className="min-w-0 truncate" title={i.value}>
                {i.value}
              </span>
            </CheckRow>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="px-1.5 text-xs text-muted-foreground">
            ไม่พบ “{term}”
          </li>
        )}
      </ul>
      {!term && sorted.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="px-1.5 text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? "แสดงน้อยลง" : `ดูทั้งหมด (${sorted.length})`}
        </button>
      )}
    </div>
  );
}

// ───────────────────────── Mobile sheet ─────────────────────────

export function FilterSheet({
  open,
  onClose,
  onClearAll,
  activeCount,
  resultCount,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onClearAll: () => void;
  activeCount: number;
  resultCount: number;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // portal ไปที่ <body>: <main> อาจโดนใส่ filter (เอฟเฟกต์ footer) ซึ่งทำให้ position: fixed เพี้ยน
  return createPortal(
    <div
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="ตัวกรอง"
    >
      <button
        type="button"
        aria-label="ปิดตัวกรอง"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-base font-bold">
            <SlidersHorizontal className="size-4 text-primary" />
            ตัวกรอง
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-px text-[11px] text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">{children}</div>
        <div className="flex gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={onClearAll}
            disabled={activeCount === 0}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            ล้างทั้งหมด
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            ดูผลลัพธ์ {resultCount.toLocaleString("th-TH")} เล่ม
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
