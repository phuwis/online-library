import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { listPublishedBooks } from "@/features/books/queries";
import { listCategories } from "@/features/categories/queries";
import { BooksClientContent } from "@/components/books-client-content";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  page?: string;
  limit?: string;
}>;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const category = params.category || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const isBookmarkView = category === "bookmarks";
  const fetchLimit = isBookmarkView ? 1000 : limit;
  const dbCategory = isBookmarkView ? undefined : category;

  const [
    { items, total, totalPages, currentPage, limit: currentLimit },
    categories,
  ] = await Promise.all([
    listPublishedBooks({
      q,
      category: dbCategory,
      page: isBookmarkView ? 1 : page,
      limit: fetchLimit,
    }),
    listCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-card/90 dark:bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-xl shrink-0 size-9 sm:size-10"
            >
              <Link href="/" aria-label="กลับหน้าแรก">
                <ArrowLeft className="size-4 sm:size-5" />
              </Link>
            </Button>

            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Library className="size-5 sm:size-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                คลังหนังสือทั้งหมด
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                เลือกหมวดหมู่หรือค้นหาหนังสือที่คุณต้องการศึกษา
              </p>
            </div>
          </div>
        </div>

        <BooksClientContent
          initialQ={q}
          initialCategory={category}
          categories={categories}
          items={items}
          total={total}
          totalPages={totalPages}
          currentPage={currentPage}
          limit={currentLimit}
        />
      </div>
    </div>
  );
}
