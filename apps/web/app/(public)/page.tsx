import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { listPublishedBooks } from "@/features/books/queries";
import { ChevronRight, ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import { ContinueReadingSection } from "@/components/continue-reading-section";
import { BookmarkSection } from "@/components/bookmark-section"; // 🌟 Import

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { items } = await listPublishedBooks({ take: 20 });
  const recentBooks = items.slice(0, 3);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="space-y-6 py-8 md:py-12 flex flex-col items-start">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
          <BookOpen className="size-3.5" />
          <span>ระบบห้องสมุดดิจิทัลอัจฉริยะ</span>
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          อ่านหนังสือออนไลน์ได้ทุกที่
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
          เลือกหนังสือที่สนใจ แล้วเริ่มอ่านได้ทันทีบนทุกอุปกรณ์
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <Button
            asChild
            size="lg"
            className="rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Link href="/books" className="flex items-center gap-2">
              <span>ดูหนังสือทั้งหมด</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 🌟 1. ส่วนหนังสือที่อ่านค้างไว้ */}
      <ContinueReadingSection allBooks={items} />

      {/* 🌟 2. ส่วนบุ๊กมาร์ก (โชว์ 3 เล่ม กดออกไม่ได้) */}
      <BookmarkSection allBooks={items} />

      {/* Recent Books Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              เพิ่มเข้ามาล่าสุด
            </h2>
            <p className="text-sm text-muted-foreground">
              หนังสือและเอกสารเผยแพร่ใหม่ล่าสุดที่คุณไม่ควรพลาด
            </p>
          </div>
          <Link
            href="/books"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recentBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.slug}`}
              className="group relative flex flex-col bg-card border border-border/60 hover:border-primary/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted mb-4 shadow-sm">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    ไม่มีรูปหน้าปก
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 justify-between space-y-1">
                <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {book.author}
                </p>
              </div>
            </Link>
          ))}

          <Link
            href="/books"
            className="group flex flex-col items-center justify-center bg-gradient-to-br from-card/80 to-muted/50 border border-dashed border-border hover:border-primary/60 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-h-[380px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110">
              <ChevronRight className="size-7 text-primary transition-transform group-hover:translate-x-0.5" />
            </div>
            <span className="font-semibold text-card-foreground group-hover:text-primary text-base mb-1 transition-colors">
              ดูหนังสือทั้งหมด
            </span>
            <p className="text-xs text-muted-foreground max-w-[180px] leading-relaxed">
              สำรวจคลังหนังสือและเอกสารทั้งหมดในระบบ
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
