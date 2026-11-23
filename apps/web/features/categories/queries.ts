import { prisma } from "@repo/db";

export function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } },
  });
}

export function listPublicCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { books: { where: { book: { status: "PUBLISHED" } } } },
      },
    },
  });
}
