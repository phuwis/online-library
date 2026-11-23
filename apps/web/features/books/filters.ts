/**
 * ตัวกรองหน้า "หนังสือทั้งหมด": ค่าคงที่ + แปลงค่าจาก URL ↔ object
 * (ไฟล์นี้ไม่มี Prisma → ใช้ได้ทั้งฝั่ง server และ client)
 *
 * รูปแบบ URL (ค่าที่เลือกได้หลายค่าใช้ key ซ้ำ):
 *   /books?q=คำค้น&category=slug&ddc=SOCIAL_SCIENCES_300&ddc=HISTORY_GEOGRAPHY_900
 *         &type=PDF&publisher=สถาบันดำรงราชานุภาพ&province=กรุงเทพมหานคร
 *         &year=2568&sort=title&page=2&limit=50
 */

export const DDC_CLASSES = [
  { value: "GENERAL_000", code: "000", label: "เบ็ดเตล็ด / ความรู้ทั่วไป" },
  { value: "PHILOSOPHY_100", code: "100", label: "ปรัชญาและจิตวิทยา" },
  { value: "RELIGION_200", code: "200", label: "ศาสนา" },
  { value: "SOCIAL_SCIENCES_300", code: "300", label: "สังคมศาสตร์" },
  { value: "LANGUAGE_400", code: "400", label: "ภาษาศาสตร์" },
  { value: "SCIENCE_500", code: "500", label: "วิทยาศาสตร์และคณิตศาสตร์" },
  {
    value: "TECHNOLOGY_600",
    code: "600",
    label: "เทคโนโลยี / วิทยาศาสตร์ประยุกต์",
  },
  {
    value: "ARTS_RECREATION_700",
    code: "700",
    label: "ศิลปะและการบันเทิง / กีฬา",
  },
  { value: "LITERATURE_800", code: "800", label: "วรรณกรรม / วรรณคดี" },
  {
    value: "HISTORY_GEOGRAPHY_900",
    code: "900",
    label: "ภูมิศาสตร์และประวัติศาสตร์",
  },
] as const;

export type DdcValue = (typeof DDC_CLASSES)[number]["value"];
const DDC_VALUES = new Set<string>(DDC_CLASSES.map((d) => d.value));

export const ddcInfo = (value: string) =>
  DDC_CLASSES.find((d) => d.value === value);

export const FILE_TYPES = ["PDF", "EPUB"] as const;
export type FileTypeValue = (typeof FILE_TYPES)[number];

export const SORT_OPTIONS = [
  { value: "new", label: "เพิ่มเข้าคลังล่าสุด" },
  { value: "old", label: "เพิ่มเข้าคลังก่อน" },
  { value: "title", label: "ชื่อหนังสือ ก–ฮ" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const LIMIT_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_LIMIT = 20;

export type BookFilters = {
  q: string;
  /** slug หมวดหมู่ หรือ "bookmarks" */
  category: string;
  ddc: DdcValue[];
  type: FileTypeValue | "";
  publisher: string[];
  province: string[];
  /** ปี พ.ศ. ที่เผยแพร่ในคลัง */
  year: number[];
  sort: SortValue;
  page: number;
  limit: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const all = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30); // กัน URL ยาวผิดปกติ

const one = (v: string | string[] | undefined) => all(v)[0] ?? "";

/** อ่านค่าจาก searchParams ของ Next (ตรวจค่าทุกตัว ค่าที่ไม่ถูกต้องถูกตัดทิ้ง) */
export function parseBookFilters(sp: RawParams): BookFilters {
  const limitRaw = Number(one(sp.limit));
  const sortRaw = one(sp.sort);
  const typeRaw = one(sp.type).toUpperCase();
  return {
    q: one(sp.q).slice(0, 100),
    category: one(sp.category),
    ddc: [
      ...new Set(all(sp.ddc).filter((d) => DDC_VALUES.has(d))),
    ] as DdcValue[],
    type: (FILE_TYPES as readonly string[]).includes(typeRaw)
      ? (typeRaw as FileTypeValue)
      : "",
    publisher: [...new Set(all(sp.publisher).map((s) => s.slice(0, 200)))],
    province: [...new Set(all(sp.province).map((s) => s.slice(0, 100)))],
    year: [...new Set(all(sp.year).map(Number))].filter(
      (y) => Number.isInteger(y) && y > 2400 && y < 2700,
    ),
    sort: SORT_OPTIONS.some((o) => o.value === sortRaw)
      ? (sortRaw as SortValue)
      : "new",
    page: Math.max(1, Math.floor(Number(one(sp.page))) || 1),
    limit: (LIMIT_OPTIONS as readonly number[]).includes(limitRaw)
      ? limitRaw
      : DEFAULT_LIMIT,
  };
}

/** แปลงกลับเป็น query string (ตัดค่าเริ่มต้นทิ้งให้ URL สั้น) */
export function toSearchParams(f: BookFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  f.ddc.forEach((v) => p.append("ddc", v));
  if (f.type) p.set("type", f.type);
  f.publisher.forEach((v) => p.append("publisher", v));
  f.province.forEach((v) => p.append("province", v));
  f.year.forEach((v) => p.append("year", String(v)));
  if (f.sort !== "new") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  if (f.limit !== DEFAULT_LIMIT) p.set("limit", String(f.limit));
  return p;
}

/** จำนวนตัวกรองขั้นสูงที่เลือกอยู่ (ไม่นับคำค้นและหมวดหมู่) */
export function countAdvancedFilters(f: BookFilters) {
  return (
    f.ddc.length +
    (f.type ? 1 : 0) +
    f.publisher.length +
    f.province.length +
    f.year.length
  );
}

/** ผลนับของแต่ละตัวเลือก: นับตามตัวกรองอื่นที่เลือกอยู่ (ไม่รวมกลุ่มของตัวเอง) */
export type FacetCount = { value: string; count: number };
export type BookFacets = {
  /** จำนวนรวมสำหรับชิป "ทั้งหมด" (ทุกตัวกรองยกเว้นหมวดหมู่) */
  categoryAll: number;
  category: FacetCount[];
  ddc: FacetCount[];
  type: FacetCount[];
  publisher: FacetCount[];
  province: FacetCount[];
  year: FacetCount[];
};
