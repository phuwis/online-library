import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ArrowLeft, Library } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { getPublishedBook } from "@/features/books/queries";
import { BookBookmarkButton } from "@/components/book-bookmark-button";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getPublishedBook(slug);
  if (!book) notFound();

  return (
    <div className="space-y-6">
      {/* ส่วนหัวและการนำทาง */}
      <div className="bg-card/90 dark:bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-xl shrink-0 size-9 sm:size-10"
            >
              <Link href="/books" aria-label="กลับไปหน้าหนังสือทั้งหมด">
                <ArrowLeft className="size-4 sm:size-5" />
              </Link>
            </Button>

            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Library className="size-5 sm:size-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                รายละเอียดหนังสือ
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                ข้อมูลและรายละเอียดเชิงลึกของหนังสือเล่มนี้
              </p>
            </div>
          </div>
        </div>

        {/* รายละเอียดเนื้อหาหนังสือภายใน Card หลัก */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-[280px_1fr] items-start pt-4 border-t border-border/60">
          {/* รูปปกหนังสือ พร้อมปุ่มบุ๊กมาร์กมุมซ้ายบน */}
          <div className="relative aspect-[3/4] w-full max-w-[220px] sm:max-w-[260px] md:max-w-none mx-auto overflow-hidden rounded-xl border bg-muted shadow-md">
            <BookBookmarkButton slug={book.slug} />

            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={`ปก ${book.title}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-secondary/50">
                <BookOpen className="size-12 text-muted-foreground/60" />
              </div>
            )}
          </div>

          {/* ข้อมูลรายละเอียด */}
          <div className="space-y-4 sm:space-y-6 text-center md:text-left">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
                {book.title}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
                โดย {book.author}
              </p>
            </div>

            {/* หมวดหมู่ */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center md:justify-start">
              {book.categories.map((bc) => (
                <Link
                  key={bc.categoryId}
                  href={`/books?category=${bc.category.slug}`}
                >
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    {bc.category.name}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* คำอธิบาย */}
            {book.description ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-left">
                <p>{book.description}</p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground/60 italic">
                ไม่มีคำอธิบายเพิ่มเติม
              </p>
            )}

            {/* ปุ่มเริ่มอ่าน */}
            <div className="pt-2 flex justify-center md:justify-start">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto px-8 shadow-md rounded-xl text-sm sm:text-base"
              >
                <Link href={`/read/${book.slug}`}>
                  <BookOpen className="size-4 mr-2" /> เริ่มอ่านหนังสือ
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
