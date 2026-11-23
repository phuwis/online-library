import { cache } from "react";
import { prisma, type Prisma } from "@repo/db";
import type { BookFacets, BookFilters, FacetCount, SortValue } from "./filters";
import { DDC_CLASSES, FILE_TYPES } from "./filters";

/** ตัวกรองที่ใช้กับรายการหนังสือหน้าบ้าน (ทุกค่าไม่บังคับ) */
type FilterInput = Partial<
  Pick<
    BookFilters,
    "q" | "category" | "ddc" | "type" | "publisher" | "province" | "year"
  >
>;

type ListParams = FilterInput & {
  sort?: SortValue;
  page?: number;
  limit?: number;
  take?: number;
};

/** ฟิลด์ที่หน้าบ้านใช้แสดงการ์ดหนังสือ (ไม่ส่ง fileUrl ออกไป) */
const publicBookSelect = {
  id: true,
  title: true,
  slug: true,
  author: true,
  coverUrl: true,
  fileType: true,
  ddc: true,
  publisher: true,
} satisfies Prisma.BookSelect;

export type PublicBookCard = Prisma.BookGetPayload<{
  select: typeof publicBookSelect;
}>;

/** จำนวน slug สูงสุดที่ค้นได้ต่อครั้ง (กันคำขอใหญ่เกินจาก client) */
export const MAX_SLUG_LOOKUP = 50;

/**
 * ดึงหนังสือที่เผยแพร่แล้วตามรายการ slug (ใช้กับข้อมูลใน localStorage
 * เช่น บุ๊กมาร์ก / ประวัติการอ่าน) — คืนผลตามลำดับ slug ที่ส่งมา
 * slug ที่ไม่พบหรือยังไม่เผยแพร่จะถูกตัดทิ้ง
 */
export async function listPublishedBooksBySlugs(slugs: string[]) {
  const unique = [...new Set(slugs)].slice(0, MAX_SLUG_LOOKUP);
  if (unique.length === 0) return [];

  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED", slug: { in: unique } },
    select: publicBookSelect,
  });

  const bySlug = new Map(books.map((b) => [b.slug, b]));
  return unique.flatMap((s) => bySlug.get(s) ?? []);
}

// ───────────────────────── ตัวกรอง ─────────────────────────

type FacetKey = "category" | "ddc" | "type" | "publisher" | "province" | "year";

/** ขอบเขตวันของปี พ.ศ. ตามเวลาประเทศไทย (UTC+7) */
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
function beYearRange(beYear: number) {
  const ce = beYear - 543;
  return {
    gte: new Date(Date.UTC(ce, 0, 1) - BKK_OFFSET_MS),
    lt: new Date(Date.UTC(ce + 1, 0, 1) - BKK_OFFSET_MS),
  };
}
const toBeYear = (d: Date) =>
  new Date(d.getTime() + BKK_OFFSET_MS).getUTCFullYear() + 543;

/**
 * สร้างเงื่อนไข where จากตัวกรอง
 * - ค่าในกลุ่มเดียวกัน = "หรือ" (เช่น DDC 300 หรือ 900)
 * - ต่างกลุ่ม = "และ"
 * omit: ข้ามกลุ่มนี้ (ใช้ตอนนับ facet ของกลุ่มนั้นเอง)
 */
function buildPublicWhere(
  f: FilterInput,
  omit?: FacetKey,
): Prisma.BookWhereInput {
  const and: Prisma.BookWhereInput[] = [{ status: "PUBLISHED" }];
  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q, mode: "insensitive" } },
        { author: { contains: f.q, mode: "insensitive" } },
        { publisher: { contains: f.q, mode: "insensitive" } },
        { bookCode: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  if (f.category && f.category !== "bookmarks" && omit !== "category") {
    and.push({ categories: { some: { category: { slug: f.category } } } });
  }
  if (f.ddc?.length && omit !== "ddc") and.push({ ddc: { in: f.ddc } });
  if (f.type && omit !== "type") and.push({ fileType: f.type });
  if (f.publisher?.length && omit !== "publisher")
    and.push({ publisher: { in: f.publisher } });
  if (f.province?.length && omit !== "province") {
    and.push({ publishingProvince: { in: f.province } });
  }
  if (f.year?.length && omit !== "year") {
    and.push({ OR: f.year.map((y) => ({ publishedAt: beYearRange(y) })) });
  }
  return { AND: and };
}

const ORDER_BY: Record<SortValue, Prisma.BookOrderByWithRelationInput[]> = {
  new: [
    { publishedAt: { sort: "desc", nulls: "last" } },
    { createdAt: "desc" },
    { id: "desc" },
  ],
  old: [
    { publishedAt: { sort: "asc", nulls: "last" } },
    { createdAt: "asc" },
    { id: "asc" },
  ],
  title: [{ title: "asc" }, { id: "asc" }],
};

/** รายการหนังสือที่เผยแพร่แล้ว — รองรับตัวกรอง การเรียง และแบ่งหน้า */
export async function listPublishedBooks({
  sort = "new",
  page = 1,
  limit = 10,
  take,
  ...filters
}: ListParams = {}) {
  const where = buildPublicWhere(filters);
  const queryTake = take !== undefined ? take : limit;
  const skip = take !== undefined ? 0 : (page - 1) * limit;

  // ดึงข้อมูลรายการหนังสือและนับจำนวนทั้งหมดพร้อมกัน
  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: ORDER_BY[sort],
      skip,
      take: queryTake,
      select: publicBookSelect,
    }),
    prisma.book.count({ where }),
  ]);

  const totalPages = Math.ceil(total / queryTake) || 1;

  return {
    items,
    total,
    totalPages,
    currentPage: page,
    limit: queryTake,
  };
}

/**
 * นับจำนวนเล่มของทุกตัวเลือกในแผงตัวกรอง (faceted search)
 * แต่ละกลุ่มนับตามตัวกรองของกลุ่มอื่น → ผู้ใช้เห็นล่วงหน้าว่าเลือกแล้วจะเหลือกี่เล่ม
 *
 * ดึงเฉพาะคอลัมน์สั้นๆ ของหนังสือที่ตรงกับคำค้น แล้วนับในหน่วยความจำ (1 query)
 * เหมาะกับคลังหลักพัน–หมื่นเล่ม ถ้าโตเกินนั้นให้เปลี่ยนเป็น prisma.book.groupBy แยกกลุ่ม
 */
export async function getBookFacets(f: FilterInput): Promise<BookFacets> {
  const rows = await prisma.book.findMany({
    where: buildPublicWhere({ q: f.q }),
    select: {
      ddc: true,
      fileType: true,
      publisher: true,
      publishingProvince: true,
      publishedAt: true,
      categories: { select: { category: { select: { slug: true } } } },
    },
  });

  const cat = f.category && f.category !== "bookmarks" ? f.category : "";
  const ddc = new Set<string>(f.ddc ?? []);
  const pub = new Set(f.publisher ?? []);
  const prov = new Set(f.province ?? []);
  const yrs = new Set(f.year ?? []);

  const facts = rows.map((r) => {
    const year = r.publishedAt ? toBeYear(r.publishedAt) : null;
    const cats = r.categories.map((c) => c.category.slug);
    return {
      r,
      year,
      cats,
      match: {
        category: !cat || cats.includes(cat),
        ddc: ddc.size === 0 || ddc.has(r.ddc),
        type: !f.type || r.fileType === f.type,
        publisher:
          pub.size === 0 || (r.publisher !== null && pub.has(r.publisher)),
        province:
          prov.size === 0 ||
          (r.publishingProvince !== null && prov.has(r.publishingProvince)),
        year: yrs.size === 0 || (year !== null && yrs.has(year)),
      } satisfies Record<FacetKey, boolean>,
    };
  });

  /** แถวที่ผ่านทุกกลุ่ม ยกเว้นกลุ่ม key */
  const passOthers = (key: FacetKey) =>
    facts.filter((x) =>
      (Object.keys(x.match) as FacetKey[]).every(
        (k) => k === key || x.match[k],
      ),
    );

  const tally = (values: (string | null)[]) => {
    const m = new Map<string, number>();
    values.forEach((v) => v && m.set(v, (m.get(v) ?? 0) + 1));
    return m;
  };
  const byCount = (m: Map<string, number>): FacetCount[] =>
    [...m]
      .map(([value, count]) => ({ value, count }))
      .sort(
        (a, b) => b.count - a.count || a.value.localeCompare(b.value, "th"),
      );
  const inOrder = (
    m: Map<string, number>,
    order: readonly string[],
  ): FacetCount[] =>
    order.map((value) => ({ value, count: m.get(value) ?? 0 }));

  const catRows = passOthers("category");
  return {
    categoryAll: catRows.length,
    category: byCount(tally(catRows.flatMap((x) => x.cats))),
    ddc: inOrder(
      tally(passOthers("ddc").map((x) => x.r.ddc)),
      DDC_CLASSES.map((d) => d.value),
    ),
    type: inOrder(
      tally(passOthers("type").map((x) => x.r.fileType)),
      FILE_TYPES,
    ),
    publisher: byCount(
      tally(
        passOthers("publisher").map((x) =>
          x.r.publisher?.trim() ? x.r.publisher : null,
        ),
      ),
    ),
    province: byCount(
      tally(
        passOthers("province").map((x) =>
          x.r.publishingProvince?.trim() ? x.r.publishingProvince : null,
        ),
      ),
    ),
    year: [
      ...tally(passOthers("year").map((x) => (x.year ? String(x.year) : null))),
    ]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => Number(b.value) - Number(a.value)),
  };
}

/** หนังสือที่เผยแพร่แล้ว 1 เล่ม (cache ต่อ 1 request: generateMetadata กับหน้าใช้ร่วมกันได้ ไม่ query ซ้ำ) */
export const getPublishedBook = cache((slug: string) =>
  prisma.book.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { categories: { include: { category: true } } },
  }),
);

/** หนังสือที่เกี่ยวข้อง: หมวดหมู่เดียวกัน หรือหมวด DDC เดียวกัน (ไม่รวมเล่มปัจจุบัน) */
export function listRelatedBooks(
  book: {
    id: string;
    ddc: Prisma.BookWhereInput["ddc"];
    categories: { categoryId: string }[];
  },
  take = 8,
) {
  const categoryIds = book.categories.map((c) => c.categoryId);
  return prisma.book.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: book.id },
      OR: [
        ...(categoryIds.length
          ? [{ categories: { some: { categoryId: { in: categoryIds } } } }]
          : []),
        { ddc: book.ddc },
      ],
    },
    orderBy: ORDER_BY.new,
    take,
    select: publicBookSelect,
  });
}

export function listBooksForAdmin(take = 100) {
  return prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { categories: { include: { category: true } } },
  });
}

/** จำนวนหนังสือที่เผยแพร่ทั้งหมด (ใช้แสดงสถิติหน้าบ้าน) */
export function countPublishedBooks() {
  return prisma.book.count({ where: { status: "PUBLISHED" } });
}
