"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import Image from "next/image";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
}

export function ContinueReadingSection({ allBooks }: { allBooks: BookItem[] }) {
  const [continueBooks, setContinueBooks] = useState<
    (BookItem & { page: number; totalSeconds: number })[]
  >([]);
  const [showAll, setShowAll] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const readHistory = allBooks
      .map((book) => {
        const savedPage = localStorage.getItem(`book_page_${book.slug}`);
        const savedTime = localStorage.getItem(`book_time_${book.slug}`);
        const page = savedPage ? parseInt(savedPage, 10) : 1;
        const totalSeconds = savedTime ? parseInt(savedTime, 10) : 0;
        return { ...book, page, totalSeconds };
      })
      .filter((book) => book.page > 1 || book.totalSeconds > 0);

    setContinueBooks(readHistory);
  }, [allBooks]);

  if (!isMounted || continueBooks.length === 0) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    if (mins < 1) return "เพิ่งเริ่มอ่าน";
    return `อ่านไปแล้ว ${mins} นาที`;
  };

  const displayedBooks = showAll ? continueBooks : continueBooks.slice(0, 3);
  const hasMore = continueBooks.length > 3;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-6 text-primary" />
            <span>หนังสือที่อ่านค้างไว้</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            ดำเนินการอ่านต่อจากหน้าที่คุณค้างไว้ล่าสุด
          </p>
        </div>
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>ดูเพิ่มเติม ({continueBooks.length})</span>
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedBooks.map((book) => (
          <Link
            key={book.id}
            href={`/read/${book.slug}`}
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
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-1 rounded-full shadow">
                หน้า {book.page}
              </div>
            </div>
            <div className="flex flex-col flex-1 justify-between space-y-1">
              <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {book.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span className="truncate">{book.author}</span>
                <span className="shrink-0 text-primary font-medium">
                  {formatTime(book.totalSeconds)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
