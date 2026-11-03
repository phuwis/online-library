import Link from "next/link";
import { Search, Library } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { listPublishedBooks } from "@/features/books/queries";
import { listCategories } from "@/features/categories/queries";
import { BookGrid } from "@/components/book-grid";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string; cursor?: string }>;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, category, cursor } = await searchParams;
  const [{ items, nextCursor }, categories] = await Promise.all([
    listPublishedBooks({ q, category, cursor }),
    listCategories(),
  ]);

  const nextHref = nextCursor
    ? `/books?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), cursor: nextCursor })}`
    : null;

  return (
    <div className="space-y-6">
      {/* ส่วนหัวและการค้นหาอยู่ใน Card เพื่อความสวยงามกลมกลืน */}
      <div className="bg-card/90 dark:bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Library className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                คลังหนังสือทั้งหมด
              </h1>
              <p className="text-xs text-muted-foreground">
                เลือกหมวดหมู่หรือค้นหาหนังสือที่คุณต้องการศึกษา
              </p>
            </div>
          </div>
        </div>

        {/* ฟอร์มค้นหา */}
        <form
          className="flex flex-col sm:flex-row gap-2 max-w-2xl"
          action="/books"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="ค้นหาชื่อหนังสือ หรือ ผู้เขียน..."
              className="pl-9 bg-background/50"
            />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          <Button type="submit" className="px-6">
            ค้นหา
          </Button>
        </form>

        {/* รายการ Badge หมวดหมู่ */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
          <Link href="/books">
            <Badge
              variant={!category ? "default" : "outline"}
              className="px-3 py-1.5 text-xs font-medium cursor-pointer"
            >
              ทั้งหมด
            </Badge>
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/books?category=${c.slug}`}>
              <Badge
                variant={category === c.slug ? "default" : "outline"}
                className="px-3 py-1.5 text-xs font-medium cursor-pointer"
              >
                {c.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* รายการแสดงผลหนังสือ (Book Grid) */}
      <div className="bg-card/90 dark:bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-6 md:p-8">
        <BookGrid books={items as Parameters<typeof BookGrid>[0]["books"]} />

        {nextHref && (
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="px-8">
              <Link href={nextHref}>ดูเพิ่มเติม</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
