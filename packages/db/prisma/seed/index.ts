// นำเข้าข้อมูลจาก JSON เดิมเข้า DB — รันซ้ำได้ (upsert)
// ปรับ type/field ให้ตรงกับโครงสร้าง JSON จริงของคุณ
import { prisma } from "../../src";
import categories from "./data/categories.json";
import books from "./data/books.json";

type SeedBook = {
  title: string;
  slug: string;
  author: string;
  description?: string;
  coverUrl?: string;
  fileUrl: string;
  fileType?: "EPUB" | "PDF";
  categorySlugs: string[];
};

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
  }

  for (const b of books as SeedBook[]) {
    const data = {
      title: b.title,
      author: b.author,
      description: b.description,
      coverUrl: b.coverUrl,
      fileUrl: b.fileUrl,
      fileType: b.fileType ?? "EPUB",
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
    };
    const book = await prisma.book.upsert({
      where: { slug: b.slug },
      update: data,
      create: { ...data, slug: b.slug },
    });

    const cats = await prisma.category.findMany({
      where: { slug: { in: b.categorySlugs } },
      select: { id: true },
    });
    await prisma.bookCategory.createMany({
      data: cats.map((c) => ({ bookId: book.id, categoryId: c.id })),
      skipDuplicates: true,
    });
  }

  console.log(`Seeded ${categories.length} categories, ${books.length} books`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
