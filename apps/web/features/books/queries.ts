import { prisma, type Prisma } from "@repo/db";

type ListParams = {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
  take?: number;
};

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
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        author: true,
        coverUrl: true,
        fileType: true,
      },
    }),
    prisma.book.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

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
