"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Bookmark, BookOpen, Sparkles } from "lucide-react";
import Image from "next/image";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
}

// 🌟 Data Object สำหรับข้อความทั้งหมด (ยกเว้นปุ่ม)
const BOOKMARK_CONTENT = {
  title: "บุ๊กมาร์กหนังสือเล่มโปรด",
  subtitle: "หนังสือและเอกสารสำคัญที่คุณบันทึกไว้สำหรับเปิดอ่านภายหลัง",
  noCoverText: "ไม่มีรูปหน้าปก",
  shelfFooterLabel: "ชั้นหนังสือที่บันทึกไว้",
  viewAllCard: {
    title: "ดูบุ๊กมาร์กทั้งหมด",
    subtitle: "จัดการรายการหนังสือโปรดของคุณ",
  },
};

export function BookmarkSection({ allBooks }: { allBooks: BookItem[] }) {
  const [bookmarkedBooks, setBookmarkedBooks] = useState<BookItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedBookmarks = localStorage.getItem("bookmarked_slugs");
    let bookmarkedSlugs: string[] = [];

    if (savedBookmarks) {
      try {
        bookmarkedSlugs = JSON.parse(savedBookmarks);
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }

    const filtered = allBooks.filter((book) =>
      bookmarkedSlugs.includes(book.slug),
    );
    setBookmarkedBooks(filtered);
  }, [allBooks]);

  if (!isMounted || bookmarkedBooks.length === 0) return null;

  const displayedBooks = bookmarkedBooks.slice(0, 3); // แสดง 3 เล่มแรก + การ์ดดูทั้งหมดเป็นช่องที่ 4

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Bookmark className="size-5 fill-amber-500" />
            </div>
            <span>{BOOKMARK_CONTENT.title}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {BOOKMARK_CONTENT.subtitle}
          </p>
        </div>
        <Link
          href="/books?category=bookmarks"
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          <span>ดูเพิ่มเติม ({bookmarkedBooks.length})</span>
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* กรอบชั้นวางหนังสือบุ๊กมาร์ก */}
      <div className="relative bg-gradient-to-b from-amber-500/5 via-card/80 to-purple-500/5 dark:from-amber-950/10 dark:via-card/60 dark:to-purple-950/20 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative z-10">
          {displayedBooks.map((book) => (
            <div key={book.id} className="group flex flex-col items-center">
              <Link
                href={`/books/${book.slug}`}
                className="relative aspect-[3/4] w-full max-w-[200px] sm:max-w-none rounded-2xl overflow-hidden bg-muted border-2 border-border/80 shadow-md group-hover:border-amber-500/70 group-hover:shadow-2xl group-hover:-translate-y-2.5 transition-all duration-500 flex flex-col"
              >
                {/* ริบบิ้นบุ๊กมาร์กสีทองด้านบนซ้าย (กดเอาออกไม่ได้ในหน้าแรก) */}
                <div className="absolute -top-1 left-3 z-10 drop-shadow-md">
                  <Bookmark className="size-8 text-amber-500 fill-amber-500" />
                </div>

                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs p-4 text-center">
                    <BookOpen className="size-8 mb-2 opacity-40" />
                    <span>{BOOKMARK_CONTENT.noCoverText}</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                  <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                    <Sparkles className="size-3.5" /> ดูรายละเอียดหนังสือ
                  </span>
                </div>
              </Link>

              <div className="w-full text-center mt-3 space-y-0.5 px-1">
                <Link
                  href={`/books/${book.slug}`}
                  className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 block"
                >
                  {book.title}
                </Link>
                <p className="text-[11px] text-muted-foreground truncate">
                  {book.author}
                </p>
              </div>
            </div>
          ))}

          {/* ช่องที่ 4: การ์ดลัดสำหรับเปิดดูรายการบุ๊กมาร์กทั้งหมด */}
          <Link
            href="/books?category=bookmarks"
            className="group flex flex-col items-center justify-center aspect-[3/4] w-full max-w-[200px] sm:max-w-none mx-auto rounded-2xl border-2 border-dashed border-amber-500/30 hover:border-amber-500/70 bg-amber-500/5 hover:bg-amber-500/10 p-5 text-center transition-all duration-300 hover:-translate-y-1.5"
          >
            <div className="size-12 rounded-2xl bg-amber-500/15 group-hover:bg-amber-500/25 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
              <Bookmark className="size-6 text-amber-500" />
            </div>
            <span className="font-semibold text-sm text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {BOOKMARK_CONTENT.viewAllCard.title}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {BOOKMARK_CONTENT.viewAllCard.subtitle} ({bookmarkedBooks.length})
            </p>
          </Link>
        </div>

        {/* ฐานชั้นวางหนังสือ */}
        <div className="mt-6 pt-3 border-t-4 border-purple-950/30 dark:border-purple-900/50 flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>{BOOKMARK_CONTENT.shelfFooterLabel}</span>
          <span className="font-medium text-amber-600 dark:text-amber-400">
            บันทึกไว้ {bookmarkedBooks.length} เล่ม
          </span>
        </div>
      </div>
    </section>
  );
}
