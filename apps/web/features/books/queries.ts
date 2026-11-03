import { prisma, type Prisma } from "@repo/db";

type ListParams = { category?: string; q?: string; cursor?: string; take?: number };

/** รายการหนังสือที่เผยแพร่แล้ว — cursor pagination (ห้ามใช้ skip ลึกๆ) */
export async function listPublishedBooks({ category, q, cursor, take = 24 }: ListParams) {
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
  const rows = await prisma.book.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: { id: true, title: true, slug: true, author: true, coverUrl: true },
  });
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
}

export function getPublishedBook(slug: string) {
  return prisma.book.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { categories: { include: { category: true } } },
  });
}

/** สำหรับ dashboard */
export function listBooksForAdmin(take = 100) {
  return prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { categories: { include: { category: true } } },
  });
}
