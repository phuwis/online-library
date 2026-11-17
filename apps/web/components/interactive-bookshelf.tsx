"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Sparkles, Eye, ArrowRight } from "lucide-react";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  author?: string | null;
  coverUrl?: string | null;
}

export function InteractiveBookshelf({ books }: { books: BookItem[] }) {
  const [activeShelf, setActiveShelf] = useState<number>(0);

  // แบ่งหนังสือออกเป็นแถวๆ ละ 4 เล่ม (เปรียบเสมือนชั้นไม้แต่ละชั้นในห้องสมุด)
  const shelves = [];
  for (let i = 0; i < books.length; i += 4) {
    shelves.push(books.slice(i, i + 4));
  }

  if (books.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* ส่วนหัวชื่อหมวดชั้นหนังสือ พร้อมเอฟเฟกต์ปฏิสัมพันธ์เล็กน้อย */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            <span>ชั้นหนังสืออัจฉริยะ (Interactive Bookshelf)</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            จำลองชั้นวางหนังสือห้องสมุดกระทรวงมหาดไทย
            เลือกเล่มที่สนใจเพื่อเปิดอ่านหรือดูรายละเอียด
          </p>
        </div>

        {/* ปุ่มสลับชั้น (ถ้ามีหลายชั้น) */}
        {shelves.length > 1 && (
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
            {shelves.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveShelf(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeShelf === idx
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ชั้นที่ {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* โครงสร้างชั้นวางหนังสือ (Bookshelf Container) */}
      <div className="relative bg-gradient-to-b from-purple-950/20 via-background to-muted/30 border border-border/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* แสงเอฟเฟกต์ฉากหลัง */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-primary/10 blur-3xl pointer-events-none" />

        {/* แสดงผลหนังสือบนชั้นที่เลือก */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative z-10">
          {shelves[activeShelf]?.map((book) => (
            <div
              key={book.id}
              className="group relative flex flex-col items-center"
            >
              {/* เล่มหนังสือที่มีเอฟเฟกต์ 3D Hover & Reflection */}
              <Link
                href={`/books/${book.slug}`}
                className="relative aspect-[3/4] w-full max-w-[200px] sm:max-w-none rounded-2xl overflow-hidden bg-card border-2 border-border/80 shadow-lg group-hover:border-primary group-hover:shadow-2xl group-hover:-translate-y-3 transition-all duration-500 flex flex-col"
              >
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center bg-muted p-4 text-center">
                    <BookOpen className="size-8 text-muted-foreground mb-2 opacity-50" />
                    <span className="text-xs text-muted-foreground font-medium">
                      ไม่มีรูปหน้าปก
                    </span>
                  </div>
                )}

                {/* Overlay เมื่อ Hover เพื่อกดอ่านด่วน */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-2">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full w-max">
                      <Sparkles className="size-3" /> เปิดอ่านทันที
                    </span>
                    <p className="text-xs font-bold line-clamp-2 leading-snug">
                      {book.title}
                    </p>
                  </div>
                </div>
              </Link>

              {/* ข้อมูลใต้เล่มหนังสือ */}
              <div className="w-full text-center mt-3 space-y-0.5 px-1">
                <Link
                  href={`/books/${book.slug}`}
                  className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 block"
                >
                  {book.title}
                </Link>
                <p className="text-[11px] text-muted-foreground truncate">
                  {book.author || "สถาบันดำรงราชานุภาพ"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 🪵 ไม้กระดานรองชั้นหนังสือ (Bookshelf Base 3D Effect) */}
        <div className="mt-8 pt-4 border-t-4 border-purple-950/40 dark:border-purple-900/60 relative">
          <div className="absolute inset-x-0 -top-1.5 h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span className="flex items-center gap-1">
              <Sparkles className="size-3.5 text-primary" />{" "}
              ชั้นวางหนังสือดิจิทัล สดร.
            </span>
            <Link
              href="/books"
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              ดูหนังสือทั้งหมดในคลัง <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
