"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookMarked,
  Clock,
  Flame,
  Play,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { formatDuration } from "@/lib/format";
import {
  useBooksBySlugs,
  useReadingHistory,
  type BookCard,
  type ReadingEntry,
} from "@/features/library/local-library";
import {
  BookTitle,
  SectionHeading,
  ShelfCabinet,
  SHELF_BOOK_W,
  ShelfCoverFallback,
  TwoRowShelf,
} from "@/components/shelf-cabinet";

const CONTINUE_CONTENT = {
  title: "หนังสือที่อ่านค้างไว้",
  subtitle: "อ่านต่อจากหน้าที่คุณค้างไว้ล่าสุด บนชั้นวางหนังสือดิจิทัล",
  noCoverText: "ไม่มีรูปหน้าปก",
  justStarted: "เพิ่งเริ่มอ่าน",
  shelfHeader: "ชั้นวางหนังสือ • ประสบการณ์อ่านต่อเนื่อง",
  shelfFooterLabel: "ชั้นวางหนังสือดิจิทัล • สถาบันดำรงราชานุภาพ",
  rightMascotSpeech: "ยอดเยี่ยมมากครับ! ลุยอ่านต่อให้จบเล่มกันเลยนะคร้าบ",
  statsTitle: "สถิติการอ่านของคุณ",
  readingCountLabel: "หนังสือที่กำลังอ่าน",
  totalReadTimeLabel: "เวลาอ่านสะสม",
  removeLabel: "นำออกจากรายการอ่านค้าง",
  privacyNote: "ข้อมูลการอ่านเก็บไว้ในเบราว์เซอร์นี้เท่านั้น",
  empty: {
    title: "ยังไม่มีหนังสือที่อ่านค้างไว้",
    description:
      "เริ่มอ่านเล่มไหนก็ได้ ระบบจะจำหน้าล่าสุดไว้ให้ กลับมาอ่านต่อได้ทันทีจากตรงนี้",
    mascotSpeech: "เริ่มจากเล่มใหม่ล่าสุดก่อนไหมครับ?",
    suggestionsLabel: "เล่มใหม่ล่าสุดในคลัง",
    browseAll: "เลือกจากหนังสือทั้งหมด",
  },
  error: "โหลดรายการอ่านค้างไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง",
};

/** แสดงสูงสุดกี่เล่มบนชั้น (เรียงจากอ่านล่าสุด) */
const MAX_SHELF_BOOKS = 20;

type ShelfItem = { book: BookCard; entry: ReadingEntry };

function progressPercent(entry: ReadingEntry): number | null {
  if (!entry.totalPages) return null;
  return Math.min(
    100,
    Math.max(0, Math.round((entry.page / entry.totalPages) * 100)),
  );
}

function readTimeLabel(seconds: number) {
  return seconds < 60
    ? CONTINUE_CONTENT.justStarted
    : `อ่านไปแล้ว ${formatDuration(seconds)}`;
}

export function ContinueReadingSection({
  suggestions,
}: {
  /** หนังสือใหม่ล่าสุด ใช้แนะนำเมื่อผู้ใช้ยังไม่เคยอ่าน */
  suggestions: BookCard[];
}) {
  const { entries, remove } = useReadingHistory();
  const slugs = entries?.slice(0, MAX_SHELF_BOOKS).map((e) => e.slug) ?? null;
  const { status, books } = useBooksBySlugs(slugs);

  const bySlug = new Map((books ?? []).map((b) => [b.slug, b]));
  const items: ShelfItem[] = (entries ?? []).flatMap((entry) => {
    const book = bySlug.get(entry.slug);
    return book ? [{ book, entry }] : [];
  });

  const isLoading =
    entries === null || (status === "loading" && books === null);
  const totalSeconds = items.reduce((acc, i) => acc + i.entry.seconds, 0);

  return (
    <section className="space-y-5 sm:space-y-6">
      <SectionHeading
        tone="purple"
        icon={<Clock className="size-5" />}
        title={CONTINUE_CONTENT.title}
        subtitle={CONTINUE_CONTENT.subtitle}
        actions={
          items.length > 0 ? (
            // จอแคบกว่า 1400px ไม่มีที่วางการ์ดสถิติข้างตู้ → แสดงย่อในการ์ดหัวข้อแทน
            <div className="min-[1400px]:hidden flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-medium text-foreground">
                <BookMarked className="size-3.5 text-primary" />
                {CONTINUE_CONTENT.readingCountLabel} {items.length} เล่ม
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-medium text-foreground">
                <Flame className="size-3.5 text-amber-500" />
                {formatDuration(totalSeconds)}
              </span>
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <ShelfFrame count={null}>
          <ShelfSkeleton />
        </ShelfFrame>
      ) : items.length > 0 ? (
        <FilledShelf items={items} onRemove={remove} />
      ) : status === "error" && (entries?.length ?? 0) > 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          {CONTINUE_CONTENT.error}
        </p>
      ) : (
        <EmptyShelf suggestions={suggestions.slice(0, 4)} />
      )}
    </section>
  );
}

/** ตู้หนังสือโทนม่วงของส่วนนี้ (ใช้ร่วมกันทุกสถานะ เพื่อไม่ให้ layout กระโดดตอนโหลดเสร็จ) */
function ShelfFrame({
  count,
  children,
}: {
  count: number | null;
  children: React.ReactNode;
}) {
  return (
    <ShelfCabinet
      tone="purple"
      label="DIGITAL BOOKSHELF"
      title={CONTINUE_CONTENT.shelfHeader}
      badge={count === null ? "…" : `${count} เล่ม`}
      footerLeft={CONTINUE_CONTENT.shelfFooterLabel}
      footerRight={
        <span className="hidden sm:inline">{CONTINUE_CONTENT.privacyNote}</span>
      }
    >
      {children}
    </ShelfCabinet>
  );
}

function ShelfSkeleton() {
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
      <span className="sr-only">กำลังโหลดหนังสือที่อ่านค้างไว้</span>
    </div>
  );
}

function FilledShelf({
  items,
  onRemove,
}: {
  items: ShelfItem[];
  onRemove: (slug: string) => void;
}) {
  const totalSeconds = items.reduce((acc, i) => acc + i.entry.seconds, 0);

  return (
    <div className="relative w-full min-[1400px]:px-28">
      {/* สถิติ (จอกว้าง ≥1400px ซึ่งมีที่ว่างข้างตู้พอ): การ์ดลอยด้านซ้าย */}
      <div className="hidden min-[1400px]:block absolute -left-20 top-1/2 -translate-y-1/2 z-30 w-52">
        <div className="bg-gradient-to-br from-purple-900/95 via-purple-950 to-indigo-950 text-white border-2 border-purple-400/50 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(88,28,135,0.4)] space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-purple-200 border-b border-purple-700/60 pb-3">
            <Trophy className="size-5 text-amber-400" />
            <span>{CONTINUE_CONTENT.statsTitle}</span>
          </div>
          <StatTile
            label={CONTINUE_CONTENT.readingCountLabel}
            value={`${items.length} เล่ม`}
            icon={<BookMarked className="size-4 text-purple-300" />}
          />
          <StatTile
            label={CONTINUE_CONTENT.totalReadTimeLabel}
            value={formatDuration(totalSeconds)}
            icon={<Flame className="size-4 text-amber-400" />}
            highlight
          />
        </div>
      </div>

      <ShelfFrame count={items.length}>
        <TwoRowShelf tone="purple">
          {items.map(({ book, entry }) => (
            <ShelfBook
              key={book.id}
              book={book}
              entry={entry}
              onRemove={() => onRemove(book.slug)}
            />
          ))}
        </TwoRowShelf>
      </ShelfFrame>

      {/* มาสคอต (จอกว้าง ≥1400px) */}
      <div className="hidden min-[1400px]:flex flex-col items-center absolute -right-20 -bottom-8 z-30 w-56 pointer-events-none">
        <SpeechBubble>{CONTINUE_CONTENT.rightMascotSpeech}</SpeechBubble>
        <Mascot className="w-52 h-52" />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 shadow-inner">
      <div className="text-[11px] text-purple-200/80 font-medium">{label}</div>
      <div
        className={`text-lg font-extrabold flex items-center justify-center gap-1.5 mt-1 ${
          highlight ? "text-amber-300" : "text-white"
        }`}
      >
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}

function ShelfBook({
  book,
  entry,
  onRemove,
}: {
  book: BookCard;
  entry: ReadingEntry;
  onRemove: () => void;
}) {
  const percent = progressPercent(entry);
  const pageLabel = entry.totalPages
    ? `หน้า ${entry.page}/${entry.totalPages}`
    : `หน้า ${entry.page}`;

  return (
    <div
      className={`group relative flex flex-col items-center shrink-0 snap-start ${SHELF_BOOK_W}`}
    >
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${CONTINUE_CONTENT.removeLabel}: ${book.title}`}
        title={CONTINUE_CONTENT.removeLabel}
        className="absolute top-2 left-2 z-20 size-7 flex items-center justify-center rounded-full bg-black/55 text-white/90 border border-white/20 backdrop-blur-sm transition-opacity hover:bg-red-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>

      <Link
        href={`/read/${book.slug}`}
        className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-purple-950/50 border-2 border-purple-500/20 shadow-xl group-hover:border-purple-300 group-hover:-translate-y-2 transition-all duration-500"
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

        <span className="absolute top-2 right-2 bg-purple-950/85 backdrop-blur-md text-purple-100 border border-purple-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-lg">
          {pageLabel}
        </span>

        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-purple-100 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span className="p-1.5 rounded-full bg-purple-600 text-white shadow">
              <Play className="size-3 fill-current" />
            </span>
            อ่านต่อหน้า {entry.page}
          </span>
        </div>

        {percent !== null && (
          <div
            className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`อ่านแล้ว ${percent}%`}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-300"
              style={{ width: `${Math.max(percent, 3)}%` }}
            />
          </div>
        )}
      </Link>

      <div className="w-full text-center mt-2 space-y-0.5 px-0.5">
        <Link href={`/read/${book.slug}`}>
          <BookTitle
            title={book.title}
            className="text-purple-50 group-hover:text-purple-300 transition-colors"
          />
        </Link>
        <p className="text-[11px] text-purple-300/80 truncate">
          {percent !== null && (
            <span className="font-semibold text-purple-100">{percent}% • </span>
          )}
          {readTimeLabel(entry.seconds)}
        </p>
      </div>
    </div>
  );
}

function EmptyShelf({ suggestions }: { suggestions: BookCard[] }) {
  return (
    <ShelfFrame count={0}>
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,15rem)_1fr] items-center">
        <div className="flex lg:flex-col items-center gap-4 text-left lg:text-center">
          <Mascot className="size-24 sm:size-28 lg:size-36 shrink-0" />
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {CONTINUE_CONTENT.empty.title}
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/85 leading-relaxed">
              {CONTINUE_CONTENT.empty.description}
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-purple-100">
                <Sparkles className="size-3.5 text-amber-300" />
                {CONTINUE_CONTENT.empty.suggestionsLabel}
              </span>
              <Link
                href="/books"
                className="inline-flex items-center gap-1 font-medium text-purple-200 hover:text-white hover:underline"
              >
                {CONTINUE_CONTENT.empty.browseAll}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {suggestions.map((book, i) => (
                <Link
                  key={book.id}
                  href={`/read/${book.slug}`}
                  // มือถือแสดง 2 เล่มพอ ไม่ให้ section ยาวเกิน
                  className={`group flex-col gap-2 ${i >= 2 ? "hidden sm:flex" : "flex"}`}
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-purple-950/50 border border-purple-500/25 shadow-lg group-hover:border-purple-300 group-hover:-translate-y-1 transition-all duration-300">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        sizes="(min-width: 640px) 160px, 45vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center p-3 text-center text-[11px] text-purple-200/70">
                        <span className="line-clamp-3">{book.title}</span>
                      </div>
                    )}
                    <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full bg-white text-purple-950 text-[11px] font-bold py-1 shadow opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 transition-all">
                      <Play className="size-3 fill-current" /> เริ่มอ่าน
                    </span>
                  </div>
                  <BookTitle
                    title={book.title}
                    className="text-purple-100 font-medium! text-[11px]! sm:text-xs!"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </ShelfFrame>
  );
}

function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-card/95 backdrop-blur-md border border-border/80 p-3 rounded-2xl shadow-xl mb-2 text-xs font-medium text-foreground text-center w-44">
      <Sparkles className="size-4 text-amber-400 mx-auto mb-1" />
      <span>{children}</span>
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-2.5 bg-card border-r border-b border-border/80 rotate-45" />
    </div>
  );
}

function Mascot({ className }: { className?: string }) {
  return (
    <div className={`relative drop-shadow-2xl ${className ?? ""}`}>
      <Image
        src="/files/librarian-mascot-3d.png"
        alt="มาสคอตบรรณารักษ์"
        fill
        sizes="224px"
        className="object-contain"
      />
    </div>
  );
}
