import { prisma, type Prisma } from "@repo/db";

type ListParams = {
  category?: string;
  q?: string;
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

/** รายการหนังสือที่เผยแพร่แล้ว — รองรับ Limit และ Pagination แบบหน้า */
export async function listPublishedBooks({
  category,
  q,
  page = 1,
  limit = 10,
  take,
}: ListParams) {
  const where: Prisma.BookWhereInput = {
    status: "PUBLISHED",
    ...(category && { categories: { some: { category: { slug: category } } } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const queryTake = take !== undefined ? take : limit;
  const skip = take !== undefined ? 0 : (page - 1) * limit;

  // ดึงข้อมูลรายการหนังสือและนับจำนวนทั้งหมดพร้อมกัน
  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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

export function getPublishedBook(slug: string) {
  return prisma.book.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { categories: { include: { category: true } } },
  });
}

export function listBooksForAdmin(take = 100) {
  return prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { categories: { include: { category: true } } },
  });
}
