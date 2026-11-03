import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { getPublishedBook } from "@/features/books/queries";

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
      {/* ปุ่มย้อนกลับ */}
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/books">
          <ArrowLeft className="size-4" /> กลับไปหน้าหนังสือทั้งหมด
        </Link>
      </Button>

      {/* การ์ดหลักสำหรับแสดงรายละเอียดหนังสือ */}
      <article className="bg-card/90 dark:bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-6 md:p-10 grid gap-8 md:grid-cols-[280px_1fr] items-start">
        {/* รูปปกหนังสือ */}
        <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border bg-muted shadow-md">
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
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {book.title}
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              โดย {book.author}
            </p>
          </div>

          {/* หมวดหมู่ */}
          <div className="flex flex-wrap gap-2">
            {book.categories.map((bc) => (
              <Link
                key={bc.categoryId}
                href={`/books?category=${bc.category.slug}`}
              >
                <Badge variant="secondary" className="px-3 py-1 text-xs">
                  {bc.category.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* คำอธิบาย */}
          {book.description && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p>{book.description}</p>
            </div>
          )}

          {/* ปุ่มเริ่มอ่าน */}
          <div className="pt-2">
            <Button asChild size="lg" className="px-8 shadow-md">
              <Link href={`/read/${book.slug}`}>
                <BookOpen className="size-4 mr-2" /> เริ่มอ่านหนังสือ
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
