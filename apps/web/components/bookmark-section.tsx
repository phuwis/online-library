"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import {
  useBookmarks,
  useBooksBySlugs,
  type BookCard,
} from "@/features/library/local-library";
import {
  BookTitle,
  SectionHeading,
  ShelfCabinet,
  SHELF_BOOK_W,
  ShelfCoverFallback,
  TwoRowShelf,
} from "@/components/shelf-cabinet";

const BOOKMARK_CONTENT = {
  title: "บุ๊กมาร์กหนังสือเล่มโปรด",
  subtitle: "หนังสือและเอกสารสำคัญที่คุณบันทึกไว้สำหรับเปิดอ่านภายหลัง",
  cabinetTitle: "ชั้นหนังสือเล่มโปรด • บันทึกไว้อ่านภายหลัง",
  footerLeft: "ชั้นหนังสือที่บันทึกไว้ • สถาบันดำรงราชานุภาพ",
  privacyNote: "บุ๊กมาร์กเก็บไว้ในเบราว์เซอร์นี้เท่านั้น",
  seeAll: "ดูทั้งหมด",
  removeLabel: "เอาบุ๊กมาร์กออก",
  viewAllCard: {
    title: "ดูบุ๊กมาร์กทั้งหมด",
    subtitle: "จัดการรายการหนังสือโปรด",
  },
  empty: {
    title: "ยังไม่มีหนังสือที่บุ๊กมาร์กไว้",
    steps: [
      "เปิดดูหนังสือที่สนใจในคลัง",
      "กดริบบิ้นที่มุมปกหนังสือเพื่อบันทึก",
      "หนังสือจะมารออยู่บนชั้นนี้ เปิดอ่านได้ทุกเมื่อ",
    ],
    cta: "ไปเลือกหนังสือ",
  },
};

/** จำนวนเล่มล่าสุดที่วางบนชั้นหน้าแรก 2 ชั้น (เล่มที่เหลือดูได้จากการ์ด "ดูทั้งหมด") */
const SHOWN_ON_HOME = 15;
/** ดึงมาเผื่อเล่มที่ถูกลบ/ยกเลิกเผยแพร่ เพื่อให้นับจำนวนได้ถูกต้อง */
const LOOKUP_LIMIT = 50;

export function BookmarkSection() {
  const { slugs, toggle } = useBookmarks();
  const lookup = slugs?.slice(0, LOOKUP_LIMIT) ?? null;
  const { status, books } = useBooksBySlugs(lookup);

  const isLoading = slugs === null || (status === "loading" && books === null);
  // กรองตาม slugs ปัจจุบันอีกชั้น เผื่อผู้ใช้เพิ่งเอาบุ๊กมาร์กออก (ระหว่างรอโหลดรอบใหม่)
  const current = new Set(slugs ?? []);
  const list = (books ?? []).filter((b) => current.has(b.slug));
  // ถ้ามีเกิน LOOKUP_LIMIT ใช้จำนวน slug จริงเป็นตัวนับ
  const count =
    (slugs?.length ?? 0) > LOOKUP_LIMIT ? slugs!.length : list.length;

  return (
    <section className="space-y-5 sm:space-y-6">
      <SectionHeading
        tone="gold"
        icon={<Bookmark className="size-5 fill-current" />}
        title={BOOKMARK_CONTENT.title}
        subtitle={BOOKMARK_CONTENT.subtitle}
        actions={
          !isLoading && list.length > 0 ? (
            <Link
              href="/books?category=bookmarks"
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              {BOOKMARK_CONTENT.seeAll} ({count})
              <ChevronRight className="size-4" />
            </Link>
          ) : undefined
        }
      />

      <ShelfCabinet
        tone="gold"
        label="BOOKMARKS"
        title={BOOKMARK_CONTENT.cabinetTitle}
        badge={
          <span className="inline-flex items-center gap-1">
            <Bookmark className="size-3 fill-current" />
            {isLoading ? "…" : `${count} เล่ม`}
          </span>
        }
        footerLeft={BOOKMARK_CONTENT.footerLeft}
        footerRight={
          <span className="hidden sm:inline">
            {BOOKMARK_CONTENT.privacyNote}
          </span>
        }
      >
        {isLoading ? (
          <BookmarkSkeleton />
        ) : list.length > 0 ? (
          <TwoRowShelf tone="gold">
            {list.slice(0, SHOWN_ON_HOME).map((book) => (
              <BookmarkBook
                key={book.id}
                book={book}
                onRemove={() => toggle(book.slug)}
              />
            ))}
            <ViewAllCard key="view-all" count={count} />
          </TwoRowShelf>
        ) : (
          <EmptyBookmarks />
        )}
      </ShelfCabinet>
    </section>
  );
}

function BookmarkBook({
  book,
  onRemove,
}: {
  book: BookCard;
  onRemove: () => void;
}) {
  return (
    <div
      className={`group relative flex flex-col items-center shrink-0 snap-start ${SHELF_BOOK_W}`}
    >
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${BOOKMARK_CONTENT.removeLabel}: ${book.title}`}
        title={BOOKMARK_CONTENT.removeLabel}
        className="absolute top-2 right-2 z-20 size-7 flex items-center justify-center rounded-full bg-black/55 text-white/90 border border-white/20 backdrop-blur-sm transition-opacity hover:bg-red-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>

      <Link
        href={`/books/${book.slug}`}
        className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-purple-950/50 border-2 border-amber-400/20 shadow-xl group-hover:border-amber-300 group-hover:-translate-y-2 transition-all duration-500"
      >
        {/* ริบบิ้นทองบนปก */}
        <Bookmark className="absolute -top-1 left-2 z-10 size-6 text-amber-400 fill-amber-400 drop-shadow-md" />

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

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-amber-200 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span className="p-1.5 rounded-full bg-amber-500 text-black shadow">
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
            className="text-amber-50 group-hover:text-amber-300 transition-colors"
          />
        </Link>
        <p className="text-[11px] text-amber-100/60 truncate">{book.author}</p>
      </div>
    </div>
  );
}

function ViewAllCard({ count }: { count: number }) {
  return (
    <Link
      href="/books?category=bookmarks"
      className={`group shrink-0 snap-start ${SHELF_BOOK_W} aspect-[3/4] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-400/40 hover:border-amber-300 bg-amber-400/5 hover:bg-amber-400/10 p-4 text-center transition-all duration-300 hover:-translate-y-1.5`}
    >
      <span className="size-12 rounded-2xl bg-amber-400/15 group-hover:bg-amber-400/25 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
        <Bookmark className="size-6 text-amber-300" />
      </span>
      <span className="font-semibold text-sm text-amber-50">
        {BOOKMARK_CONTENT.viewAllCard.title}
      </span>
      <span className="text-[11px] text-amber-100/60 mt-1 leading-relaxed">
        {BOOKMARK_CONTENT.viewAllCard.subtitle} ({count})
      </span>
    </Link>
  );
}

function BookmarkSkeleton() {
  return (
    <div className="space-y-3 overflow-hidden" aria-hidden>
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-4 sm:gap-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`shrink-0 space-y-2 ${SHELF_BOOK_W}`}>
              <div className="aspect-[3/4] rounded-xl bg-white/10 animate-pulse" />
              <div className="h-3 rounded bg-white/10 animate-pulse" />
              <div className="h-2.5 w-2/3 mx-auto rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyBookmarks() {
  return (
    <div className="grid gap-8 md:gap-12 md:grid-cols-[auto_1fr] items-center py-2 max-w-3xl mx-auto">
      {/* ภาพประกอบ: ปกหนังสือจำลองซ้อนกัน 3 เล่ม พร้อมริบบิ้น */}
      <div className="relative mx-auto h-44 w-48 sm:h-52 sm:w-56" aria-hidden>
        <div className="absolute left-0 top-6 h-36 w-28 sm:h-40 sm:w-32 -rotate-6 rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-400/5" />
        <div className="absolute right-0 top-6 h-36 w-28 sm:h-40 sm:w-32 rotate-6 rounded-xl border-2 border-dashed border-purple-300/40 bg-purple-300/5" />
        <div className="absolute left-1/2 top-0 h-40 w-30 sm:h-44 sm:w-34 -translate-x-1/2 rounded-xl border-2 border-amber-300/40 bg-gradient-to-br from-purple-800 to-purple-950 shadow-xl flex items-center justify-center">
          <BookOpen className="size-10 text-amber-100/40" />
          <Bookmark className="absolute -top-1 left-3 size-9 text-amber-400 fill-amber-400 drop-shadow-md animate-bounce [animation-duration:2.4s]" />
        </div>
      </div>

      <div className="space-y-4 text-center md:text-left">
        <h3 className="text-lg sm:text-xl font-bold text-amber-50">
          {BOOKMARK_CONTENT.empty.title}
        </h3>
        <ol className="space-y-2.5 text-sm text-amber-100/75 inline-block text-left">
          {BOOKMARK_CONTENT.empty.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="mt-0.5 size-5 shrink-0 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div>
          <Link
            href="/books"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black shadow-md transition-colors hover:bg-amber-300"
          >
            {BOOKMARK_CONTENT.empty.cta}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
