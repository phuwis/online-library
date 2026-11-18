"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Eye, Library } from "lucide-react";
import {
  BookTitle,
  SectionHeading,
  SHELF_BOOK_W,
  ShelfArrow,
  ShelfCabinet,
  ShelfCoverFallback,
  ShelfPlank,
} from "@/components/shelf-cabinet";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  author?: string | null;
  coverUrl?: string | null;
  fileType?: string | null;
}

const SHELF_CONTENT = {
  title: "ชั้นหนังสืออัจฉริยะ",
  subtitle:
    "จำลองชั้นวางหนังสือห้องสมุดกระทรวงมหาดไทย เลือกเล่มที่สนใจเพื่อเปิดอ่านหรือดูรายละเอียด",
  cabinetTitle: "ชั้นหนังสือดิจิทัล • ห้องสมุดกระทรวงมหาดไทย",
  footerLeft: "ชั้นวางหนังสือดิจิทัล สดร.",
  seeAll: "ดูหนังสือทั้งหมดในคลัง",
  fallbackAuthor: "สถาบันดำรงราชานุภาพ",
  empty: {
    title: "ชั้นหนังสือยังว่างอยู่",
    description: "หนังสือที่เผยแพร่แล้วจะแสดงบนชั้นนี้โดยอัตโนมัติ",
  },
};

/** หนังสือต่อ 1 ชั้น และจำนวนชั้นที่แสดงพร้อมกัน */
const BOOKS_PER_SHELF = 4;
const SHELVES_PER_PAGE = 2;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** "ชั้น 1–2" / "ชั้น 5" */
function shelfRangeLabel(page: number, totalShelves: number) {
  const first = page * SHELVES_PER_PAGE + 1;
  const last = Math.min(first + SHELVES_PER_PAGE - 1, totalShelves);
  return first === last ? `ชั้น ${first}` : `ชั้น ${first}–${last}`;
}

export function InteractiveBookshelf({ books }: { books: BookItem[] }) {
  const [activePage, setActivePage] = useState(0);

  const shelves = chunk(books, BOOKS_PER_SHELF);
  const pages = chunk(shelves, SHELVES_PER_PAGE);
  // เติมชั้นว่างให้ครบ 2 ชั้นเสมอ (โครงตู้คงที่ ไม่กระโดด)
  const visible: BookItem[][] = Array.from(
    { length: SHELVES_PER_PAGE },
    (_, i) => pages[activePage]?.[i] ?? [],
  );
  const hasMany = pages.length > 1;

  return (
    <section className="space-y-5 sm:space-y-6">
      <SectionHeading
        tone="indigo"
        icon={<Library className="size-5" />}
        title={SHELF_CONTENT.title}
        subtitle={SHELF_CONTENT.subtitle}
        actions={
          hasMany ? (
            <ShelfSwitcher
              labels={pages.map((_, i) => shelfRangeLabel(i, shelves.length))}
              active={activePage}
              onChange={setActivePage}
            />
          ) : undefined
        }
      />

      <ShelfCabinet
        tone="indigo"
        label="LIBRARY SHELF"
        title={SHELF_CONTENT.cabinetTitle}
        badge={
          shelves.length > 0
            ? `${shelfRangeLabel(activePage, shelves.length)} จาก ${shelves.length}`
            : "0 เล่ม"
        }
        footerLeft={SHELF_CONTENT.footerLeft}
        footerRight={
          <Link
            href="/books"
            className="inline-flex items-center gap-1 font-semibold text-indigo-100 hover:text-white hover:underline"
          >
            {SHELF_CONTENT.seeAll}
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        {books.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <BookOpen className="size-10 mx-auto text-indigo-200/50" />
            <h3 className="text-base font-bold text-white">
              {SHELF_CONTENT.empty.title}
            </h3>
            <p className="text-sm text-indigo-200/75">
              {SHELF_CONTENT.empty.description}
            </p>
          </div>
        ) : (
          <>
            {hasMany && (
              <>
                <ShelfArrow
                  direction="left"
                  label="ชั้นก่อนหน้า"
                  disabled={activePage === 0}
                  onClick={() => setActivePage((i) => Math.max(0, i - 1))}
                />
                <ShelfArrow
                  direction="right"
                  label="ชั้นถัดไป"
                  disabled={activePage === pages.length - 1}
                  onClick={() =>
                    setActivePage((i) => Math.min(pages.length - 1, i + 1))
                  }
                />
              </>
            )}

            <div className="max-w-[40rem] mx-auto space-y-3">
              {visible.map((row, i) => (
                <div key={i}>
                  {/* มือถือ: เลื่อนแนวนอนในชั้น / จอกว้าง: 4 เล่มเต็มชั้น */}
                  <div className="overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="w-max mx-auto flex items-start gap-4 sm:gap-5 px-1 min-h-[13.25rem] sm:min-h-[14rem]">
                      {row.map((book) => (
                        <ShelfBook key={book.id} book={book} />
                      ))}
                    </div>
                  </div>
                  <ShelfPlank tone="indigo" />
                </div>
              ))}
            </div>
          </>
        )}
      </ShelfCabinet>
    </section>
  );
}

function ShelfSwitcher({
  labels,
  active,
  onChange,
}: {
  labels: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="เลือกชั้นหนังสือ"
      className="flex flex-wrap items-center gap-1 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-1"
    >
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={active === i}
          onClick={() => onChange(i)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            active === i
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-indigo-500/10"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ShelfBook({ book }: { book: BookItem }) {
  return (
    <div
      className={`group flex flex-col items-center shrink-0 snap-start ${SHELF_BOOK_W}`}
    >
      <Link
        href={`/books/${book.slug}`}
        className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-indigo-950/50 border-2 border-indigo-300/20 shadow-xl group-hover:border-cyan-200/80 group-hover:-translate-y-2 transition-all duration-500"
      >
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="128px"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <ShelfCoverFallback title={book.title} />
        )}

        {book.fileType && (
          <span className="absolute top-2 right-2 rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {book.fileType}
          </span>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-cyan-100 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span className="p-1.5 rounded-full bg-indigo-500 text-white shadow">
              <Eye className="size-3" />
            </span>
            ดูรายละเอียด
          </span>
        </div>
      </Link>

      <div className="w-full text-center mt-2 space-y-0.5 px-0.5">
        <Link href={`/books/${book.slug}`}>
          <BookTitle
            title={book.title}
            className="text-indigo-50 group-hover:text-cyan-200 transition-colors"
          />
        </Link>
        <p className="text-[11px] text-indigo-200/65 truncate">
          {book.author || SHELF_CONTENT.fallbackAuthor}
        </p>
      </div>
    </div>
  );
}
