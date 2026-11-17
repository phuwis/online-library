"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  Trophy,
  BookMarked,
  Flame,
} from "lucide-react";
import Image from "next/image";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
}

const CONTINUE_CONTENT = {
  title: "หนังสือที่อ่านค้างไว้",
  subtitle:
    "ดำเนินการอ่านต่อจากหน้าที่คุณค้างไว้ล่าสุด บนชั้นวางหนังสือดิจิทัล",
  noCoverText: "ไม่มีรูปหน้าปก",
  justStarted: "เพิ่งเริ่มอ่าน",
  shelfFooterLabel: "ชั้นวางหนังสือดิจิทัล • สถาบันดำรงราชานุภาพ",
  rightMascotSpeech: "ยอดเยี่ยมมากครับ! ลุยอ่านต่อให้จบเล่มกันเลยนะคร้าบ",
  leftStatsTitle: "สถิติการอ่านของคุณ",
  completedBooksLabel: "หนังสือที่กำลังติดตาม",
  totalReadTimeLabel: "เวลาอ่านสะสม",
};

export function ContinueReadingSection({ allBooks }: { allBooks: BookItem[] }) {
  const [continueBooks, setContinueBooks] = useState<
    (BookItem & { page: number; totalSeconds: number })[]
  >([]);
  const [isMounted, setIsMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left:
          direction === "left"
            ? scrollLeft - scrollAmount
            : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!isMounted || continueBooks.length === 0) return null;

  const totalAccumulatedSeconds = continueBooks.reduce(
    (acc, book) => acc + book.totalSeconds,
    0,
  );
  const totalMinutes = Math.floor(totalAccumulatedSeconds / 60);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    if (mins < 1) return CONTINUE_CONTENT.justStarted;
    return `อ่านไปแล้ว ${mins} นาที`;
  };

  return (
    <section className="space-y-6">
      {/* Header หัวข้อส่วน */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="size-5" />
            </div>
            <span>{CONTINUE_CONTENT.title}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {CONTINUE_CONTENT.subtitle}
          </p>
        </div>

        {/* ปุ่มเลื่อนสไลด์ซ้าย-ขวา */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-xl bg-purple-950/10 hover:bg-purple-950/20 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-950 dark:text-purple-200 transition-colors shadow-sm"
            aria-label="เลื่อนซ้าย"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-xl bg-purple-950/10 hover:bg-purple-950/20 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-950 dark:text-purple-200 transition-colors shadow-sm"
            aria-label="เลื่อนขวา"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* 🌟 โครงสร้างหลัก: เพิ่ม Padding ด้านข้าง และดันการ์ดสถิติกับมาสคอตให้ออกห่างจากตู้หนังสืออย่างชัดเจน */}
      <div className="relative w-full xl:px-28 my-10">
        {/* 📊 1. ฝั่งซ้าย: การ์ดสถิติการอ่าน (ดันออกห่างจากตู้หนังสือด้วย -left-20 ถึง -left-24) */}
        <div className="hidden xl:flex flex-col items-center absolute -left-20 top-1/2 -translate-y-1/2 z-30 w-52 pointer-events-none">
          <div className="relative bg-gradient-to-br from-purple-900/95 via-purple-950 to-indigo-950 text-white backdrop-blur-xl border-2 border-purple-400/50 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(88,28,135,0.4)] space-y-4 pointer-events-auto w-52 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-purple-200 border-b border-purple-700/60 pb-3">
              <Trophy className="size-5 text-amber-400" />
              <span>{CONTINUE_CONTENT.leftStatsTitle}</span>
            </div>

            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-inner">
                <div className="text-[11px] text-purple-200/80 font-medium">
                  {CONTINUE_CONTENT.completedBooksLabel}
                </div>
                <div className="text-lg font-extrabold text-white flex items-center justify-center gap-1.5 mt-1">
                  <BookMarked className="size-4 text-purple-300" />
                  <span>{continueBooks.length} เล่ม</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-inner">
                <div className="text-[11px] text-purple-200/80 font-medium">
                  {CONTINUE_CONTENT.totalReadTimeLabel}
                </div>
                <div className="text-lg font-extrabold text-amber-300 flex items-center justify-center gap-1.5 mt-1">
                  <Flame className="size-4 text-amber-400" />
                  <span>{totalMinutes} นาที</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📚 2. ตรงกลาง: ตู้ชั้นหนังสือ Royal Purple ขยายเต็มพื้นที่ตรงกลาง */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-900/30 dark:border-purple-700/40 bg-gradient-to-b from-purple-950/90 via-purple-900/80 to-indigo-950/90 text-white z-10">
          {/* แผงหัวตู้ */}
          <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-6 py-3.5 tracking-wider text-center text-sm sm:text-base font-bold shadow-inner border-b border-purple-700/40 flex items-center justify-between text-purple-100">
            <span className="opacity-75 text-xs uppercase tracking-widest hidden sm:inline">
              DIGITAL BOOKSHELF
            </span>
            <span className="drop-shadow-md mx-auto">
              ชั้นวางหนังสือ • ประสบการณ์อ่านต่อเนื่อง
            </span>
            <span className="bg-white/10 px-3 py-0.5 rounded-full text-xs text-purple-200 border border-white/10">
              {continueBooks.length} เล่ม
            </span>
          </div>

          {/* พื้นที่วางหนังสือ เลื่อนขวาได้ */}
          <div className="relative p-6 sm:p-10">
            <div
              ref={scrollContainerRef}
              className="flex items-start gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {continueBooks.map((book) => (
                <div
                  key={book.id}
                  className="group flex flex-col items-center shrink-0 w-[170px] sm:w-[190px]"
                >
                  <Link
                    href={`/read/${book.slug}`}
                    className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted border-2 border-purple-500/20 shadow-xl group-hover:border-purple-300 group-hover:-translate-y-2.5 transition-all duration-500 flex flex-col"
                  >
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs p-4 text-center bg-purple-950/50">
                        <BookOpen className="size-8 mb-2 opacity-40 text-purple-300" />
                        <span>{CONTINUE_CONTENT.noCoverText}</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 bg-purple-950/85 backdrop-blur-md text-purple-200 border border-purple-500/30 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
                      หน้า {book.page}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                      <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 text-xs font-semibold text-purple-200">
                        <span className="p-1.5 rounded-full bg-purple-600 text-white shadow">
                          <Play className="size-3 fill-current" />
                        </span>
                        <span>อ่านต่อหน้า {book.page}</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-indigo-300 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(15, book.page * 5))}%`,
                        }}
                      />
                    </div>
                  </Link>

                  <div className="w-full text-center mt-3 space-y-1 px-1">
                    <Link
                      href={`/read/${book.slug}`}
                      className="font-semibold text-xs sm:text-sm text-purple-100 group-hover:text-purple-300 transition-colors line-clamp-1 block"
                    >
                      {book.title}
                    </Link>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-purple-300/70">
                      <span className="truncate max-w-[100px]">
                        {book.author}
                      </span>
                      <span>•</span>
                      <span className="font-medium shrink-0 text-purple-200">
                        {formatTime(book.totalSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ฐานชั้นวาง */}
          <div className="relative h-6 bg-gradient-to-b from-purple-950 to-indigo-950 border-t border-purple-700/40 shadow-inner flex items-center justify-between px-6 text-[11px] text-purple-300/80">
            <span>{CONTINUE_CONTENT.shelfFooterLabel}</span>
            <span className="italic">สถาบันดำรงราชานุภาพ</span>
          </div>
        </div>

        {/* 🦁 3. ฝั่งขวา: มาสคอตตัวยักษ์ (ดันออกห่างจากตู้หนังสือด้วย -right-20 ถึง -right-24) */}
        <div className="hidden xl:flex flex-col items-center absolute -right-20 -bottom-6 z-30 w-60 pointer-events-none">
          <div className="relative bg-card/95 backdrop-blur-md border border-border/80 p-3.5 rounded-2xl shadow-xl mb-3 text-xs font-medium text-foreground text-center pointer-events-auto w-48">
            <Sparkles className="size-4 text-amber-400 mx-auto mb-1" />
            <span>{CONTINUE_CONTENT.rightMascotSpeech}</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-card border-r border-b border-border/80 transform rotate-45" />
          </div>

          <div className="relative pointer-events-auto hover:scale-105 transition-transform duration-300">
            <div className="w-60 h-60 relative drop-shadow-2xl">
              <Image
                src="/files/librarian-mascot-3d.png"
                alt="มาสคอตบรรณารักษ์"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
