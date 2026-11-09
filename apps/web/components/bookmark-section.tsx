"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Bookmark } from "lucide-react";
import Image from "next/image";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
}

export function BookmarkSection({ allBooks }: { allBooks: BookItem[] }) {
  const [bookmarkedBooks, setBookmarkedBooks] = useState<BookItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // ดึงข้อมูลรายการ slug ที่ถูกบุ๊กมาร์กไว้จาก localStorage
    const savedBookmarks = localStorage.getItem("bookmarked_slugs");
    let bookmarkedSlugs: string[] = [];

    if (savedBookmarks) {
      try {
        bookmarkedSlugs = JSON.parse(savedBookmarks);
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }

    // กรองหนังสือที่มี slug อยู่ในรายการบุ๊กมาร์ก
    const filtered = allBooks.filter((book) =>
      bookmarkedSlugs.includes(book.slug),
    );
    setBookmarkedBooks(filtered);
  }, [allBooks]);

  if (!isMounted || bookmarkedBooks.length === 0) return null;

  const displayedBooks = bookmarkedBooks.slice(0, 3); // แสดง 3 เล่มแรก

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bookmark className="size-6 text-yellow-500 fill-yellow-500" />
            <span>บุ๊กมาร์ก</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            หนังสือที่คุณบันทึกไว้สำหรับอ่านภายหลัง
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedBooks.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.slug}`}
            className="group relative flex flex-col bg-card border border-border/60 hover:border-primary/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted mb-4 shadow-sm">
              {/* 🌟 แสดงธงสีเหลืองซ้ายบน (หน้าแรกไม่สามารถกดเอาออกได้) */}
              <div className="absolute top-0 left-3 z-10 drop-shadow-md">
                <Bookmark className="size-7 text-yellow-500 fill-yellow-500" />
              </div>

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
      </div>
    </section>
  );
}
