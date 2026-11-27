/**
 * ช่วงเวลาของ dashboard (ใช้ได้ทั้งฝั่ง server และ client)
 * ทุกวันที่เป็น "วันที่ตามเวลาไทย" รูปแบบ YYYY-MM-DD และช่วงเป็นแบบรวมวันสุดท้าย (inclusive)
 */

export const RANGE_PRESETS = [
  { value: "today", label: "วันนี้" },
  { value: "yesterday", label: "เมื่อวาน" },
  { value: "7d", label: "7 วันล่าสุด" },
  { value: "30d", label: "30 วันล่าสุด" },
  { value: "90d", label: "90 วันล่าสุด" },
  { value: "this-month", label: "เดือนนี้" },
  { value: "last-month", label: "เดือนที่แล้ว" },
  { value: "fiscal-year", label: "ปีงบประมาณนี้" },
  { value: "this-year", label: "ปีนี้" },
  { value: "12m", label: "12 เดือนล่าสุด" },
  { value: "custom", label: "กำหนดเอง" },
] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

export const GRANULARITIES = [
  { value: "auto", label: "อัตโนมัติ" },
  { value: "hour", label: "รายชั่วโมง" },
  { value: "day", label: "รายวัน" },
  { value: "week", label: "รายสัปดาห์" },
  { value: "month", label: "รายเดือน" },
] as const;
export type GranularityOption = (typeof GRANULARITIES)[number]["value"];
export type Granularity = Exclude<GranularityOption, "auto">;

export const DEFAULT_PRESET: RangePreset = "30d";
export const MAX_RANGE_DAYS = 1096; // ~3 ปี

const DAY_MS = 24 * 3600 * 1000;
const THAI_OFFSET_MS = 7 * 3600 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ───────────── วันที่แบบ YYYY-MM-DD ─────────────

/** "YYYY-MM-DD" → เลขวัน (นับจาก epoch) */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / DAY_MS);
}

export function fromDayNumber(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export const addDays = (date: string, n: number) =>
  fromDayNumber(dayNumber(date) + n);

export function isValidDate(date: string | null | undefined): date is string {
  if (!date || !DATE_RE.test(date)) return false;
  return fromDayNumber(dayNumber(date)) === date;
}

/** วันนี้ตามเวลาไทย */
export function thaiToday(now = new Date()): string {
  return new Date(now.getTime() + THAI_OFFSET_MS).toISOString().slice(0, 10);
}

/** เที่ยงคืนเวลาไทยของวันนั้น เป็นเวลา UTC (ISO) — ใช้เทียบกับคอลัมน์ occurredAt */
export function thaiMidnightUtc(date: string): Date {
  return new Date(dayNumber(date) * DAY_MS - THAI_OFFSET_MS);
}

/** วันจันทร์ของสัปดาห์ */
export function weekStart(date: string): string {
  const n = dayNumber(date);
  const dow = (new Date(n * DAY_MS).getUTCDay() + 6) % 7; // จันทร์ = 0
  return fromDayNumber(n - dow);
}

export const monthStart = (date: string) => `${date.slice(0, 7)}-01`;

function addMonths(date: string, n: number): string {
  const [y, m] = date.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

// ───────────── ช่วงเวลา ─────────────

export type RangeInput = {
  range?: string | null;
  from?: string | null;
  to?: string | null;
  granularity?: string | null;
  compare?: string | null;
};

export type ResolvedRange = {
  preset: RangePreset;
  from: string;
  to: string;
  days: number;
  granularity: Granularity;
  granularityOption: GranularityOption;
  allowedGranularities: Granularity[];
  compare: boolean;
  prevFrom: string;
  prevTo: string;
  /** ข้อความอธิบายช่วง เช่น "ปีงบประมาณ พ.ศ. 2570" */
  title: string;
  today: string;
};

function presetBounds(preset: RangePreset, today: string): [string, string] {
  switch (preset) {
    case "today":
      return [today, today];
    case "yesterday": {
      const y = addDays(today, -1);
      return [y, y];
    }
    case "7d":
      return [addDays(today, -6), today];
    case "30d":
      return [addDays(today, -29), today];
    case "90d":
      return [addDays(today, -89), today];
    case "this-month":
      return [monthStart(today), today];
    case "last-month": {
      const start = addMonths(monthStart(today), -1);
      return [start, addDays(monthStart(today), -1)];
    }
    case "fiscal-year":
      return [fiscalYearStart(today), today];
    case "this-year":
      return [`${today.slice(0, 4)}-01-01`, today];
    case "12m":
      return [addDays(addMonths(today, -12), 1), today];
    default:
      return [addDays(today, -29), today];
  }
}

/** ปีงบประมาณราชการไทยเริ่ม 1 ต.ค. */
export function fiscalYearStart(date: string): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return m >= 10 ? `${y}-10-01` : `${y - 1}-10-01`;
}

/** ปีงบประมาณ (พ.ศ.) ของวันที่ */
export function fiscalYearBE(date: string): number {
  return Number(fiscalYearStart(date).slice(0, 4)) + 1 + 543;
}

export function allowedGranularities(days: number): Granularity[] {
  const list: Granularity[] = [];
  if (days <= 7) list.push("hour");
  if (days <= 400) list.push("day");
  if (days >= 7) list.push("week");
  if (days >= 28) list.push("month");
  return list;
}

export function autoGranularity(days: number): Granularity {
  if (days <= 2) return "hour";
  if (days <= 92) return "day";
  if (days <= 366) return "week";
  return "month";
}

export function resolveRange(
  input: RangeInput,
  now = new Date(),
): ResolvedRange {
  const today = thaiToday(now);
  const presetValues = RANGE_PRESETS.map((p) => p.value) as readonly string[];
  let preset: RangePreset = presetValues.includes(input.range ?? "")
    ? (input.range as RangePreset)
    : DEFAULT_PRESET;

  let from: string;
  let to: string;
  if (preset === "custom" && isValidDate(input.from) && isValidDate(input.to)) {
    from = input.from;
    to = input.to;
    if (dayNumber(from) > dayNumber(to)) [from, to] = [to, from];
    if (dayNumber(to) > dayNumber(today)) to = today;
    if (dayNumber(from) > dayNumber(to)) from = to;
    if (dayNumber(to) - dayNumber(from) + 1 > MAX_RANGE_DAYS) {
      from = addDays(to, -(MAX_RANGE_DAYS - 1));
    }
  } else {
    if (preset === "custom") preset = DEFAULT_PRESET;
    [from, to] = presetBounds(preset, today);
  }

  const days = dayNumber(to) - dayNumber(from) + 1;
  const allowed = allowedGranularities(days);
  const option = (
    GRANULARITIES.map((g) => g.value) as readonly string[]
  ).includes(input.granularity ?? "")
    ? (input.granularity as GranularityOption)
    : "auto";
  const granularity =
    option !== "auto" && allowed.includes(option)
      ? option
      : autoGranularity(days);

  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));

  return {
    preset,
    from,
    to,
    days,
    granularity,
    granularityOption:
      option !== "auto" && allowed.includes(option) ? option : "auto",
    allowedGranularities: allowed,
    compare: input.compare !== "0",
    prevFrom,
    prevTo,
    title:
      preset === "fiscal-year"
        ? `ปีงบประมาณ พ.ศ. ${fiscalYearBE(today)}`
        : formatThaiRange(from, to),
    today,
  };
}

// ───────────── bucket ของกราฟ ─────────────

/** key ของ bucket ต้องตรงกับที่ SQL สร้าง (ดู dashboard-queries.ts) */
export function bucketKeys(from: string, to: string, g: Granularity): string[] {
  const keys: string[] = [];
  if (g === "hour") {
    for (let n = dayNumber(from); n <= dayNumber(to); n++) {
      const day = fromDayNumber(n);
      for (let h = 0; h < 24; h++)
        keys.push(`${day}T${String(h).padStart(2, "0")}`);
    }
    return keys;
  }
  if (g === "day") {
    for (let n = dayNumber(from); n <= dayNumber(to); n++)
      keys.push(fromDayNumber(n));
    return keys;
  }
  if (g === "week") {
    for (
      let d = weekStart(from);
      dayNumber(d) <= dayNumber(to);
      d = addDays(d, 7)
    )
      keys.push(d);
    return keys;
  }
  for (
    let d = monthStart(from);
    dayNumber(d) <= dayNumber(to);
    d = addMonths(d, 1)
  )
    keys.push(d);
  return keys;
}

// ───────────── รูปแบบวันที่ภาษาไทย ─────────────

const TH_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const TH_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export function formatThaiDate(date: string, withYear = true): string {
  const [y, m, d] = date.split("-").map(Number);
  const base = `${d} ${TH_MONTHS[m! - 1]}`;
  return withYear ? `${base} ${(y! + 543) % 100}` : base;
}

export function formatThaiRange(from: string, to: string): string {
  if (from === to) return formatThaiDate(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${formatThaiDate(from, !sameYear)} – ${formatThaiDate(to)}`;
}

export function thaiWeekday(date: string): string {
  return TH_DAYS[new Date(dayNumber(date) * DAY_MS).getUTCDay()]!;
}

/** ป้ายของ bucket บนแกน X (สั้น) และใน tooltip (ยาว) */
export function bucketLabel(
  key: string,
  g: Granularity,
  range: { from: string; to: string },
): { short: string; long: string } {
  if (g === "hour") {
    const [day, hh] = key.split("T");
    const multiDay = range.from !== range.to;
    return {
      short:
        multiDay && hh === "00"
          ? `${thaiWeekday(day!)} ${formatThaiDate(day!, false)}`
          : `${hh}:00`,
      long: `${thaiWeekday(day!)} ${formatThaiDate(day!)} เวลา ${hh}:00–${hh}:59 น.`,
    };
  }
  if (g === "day") {
    return {
      short: formatThaiDate(key, false),
      long: `${thaiWeekday(key)} ${formatThaiDate(key)}`,
    };
  }
  if (g === "week") {
    const start = dayNumber(key) < dayNumber(range.from) ? range.from : key;
    const endRaw = addDays(key, 6);
    const end = dayNumber(endRaw) > dayNumber(range.to) ? range.to : endRaw;
    return {
      short: formatThaiDate(start, false),
      long: `สัปดาห์ ${formatThaiRange(start, end)}`,
    };
  }
  const [y, m] = key.split("-").map(Number);
  return {
    short: `${TH_MONTHS[m! - 1]} ${(y! + 543) % 100}`,
    long: `${TH_MONTHS[m! - 1]} ${y! + 543}`,
  };
}
