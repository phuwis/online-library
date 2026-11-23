"use client";

/**
 * ชิ้นส่วน UI ของหน้า "หนังสือทั้งหมด"
 * - Highlight: ไฮไลต์คำค้นในข้อความ
 * - BookGridCard / BookTable: แสดงหนังสือแบบกริด / ตาราง
 * - Pagination: แบ่งหน้าแบบมีเลขหน้า + เลือกจำนวนต่อหน้า
 * - BooksEmptyState: สถานะไม่พบหนังสือ
 */

import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  SearchX,
} from "lucide-react";
import { ddcInfo } from "@/features/books/filters";

export type BookItem = {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  fileType?: string;
  ddc?: string;
  publisher?: string | null;
};

// ───────────────────────── Highlight ─────────────────────────

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-200/80 text-inherit dark:bg-amber-400/30"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ───────────────────────── Bookmark button ─────────────────────────

function BookmarkToggle({
  active,
  onToggle,
  title,
  className = "",
}: {
  active: boolean;
  onToggle: () => void;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={`${active ? "เอาบุ๊กมาร์กออก" : "บุ๊กมาร์ก"}: ${title}`}
      title={active ? "เอาบุ๊กมาร์กออก" : "บุ๊กมาร์กไว้อ่านภายหลัง"}
      className={`transition-transform hover:scale-110 focus-visible:scale-110 ${className}`}
    >
      <Bookmark
        className={`drop-shadow-md ${
          active
            ? "fill-amber-400 text-amber-400"
            : "fill-black/25 text-white/85 hover:text-amber-300"
        }`}
      />
    </button>
  );
}

// ───────────────────────── Grid card ─────────────────────────

export function BookGridCard({
  book,
  query,
  bookmarked,
  onToggleBookmark,
}: {
  book: BookItem;
  query: string;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl sm:p-3">
      <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted shadow-sm">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="(min-width: 1024px) 190px, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-950 p-3 text-center text-xs text-purple-100/70">
            <BookOpen className="mb-2 size-7 opacity-60" />
            <span className="line-clamp-3">{book.title}</span>
          </div>
        )}

        {book.fileType && (
          <span className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {book.fileType}
          </span>
        )}
        {book.ddc && ddcInfo(book.ddc) && (
          <span
            title={`DDC ${ddcInfo(book.ddc)!.code} ${ddcInfo(book.ddc)!.label}`}
            className="absolute bottom-2 left-2 rounded-md border border-white/20 bg-purple-950/75 px-1.5 py-0.5 font-mono text-[10px] font-bold text-purple-100 backdrop-blur-sm transition-opacity group-hover:opacity-0"
          >
            {ddcInfo(book.ddc)!.code}
          </span>
        )}

        {/* ปุ่มลัดตอนชี้ (จอที่มีเมาส์) */}
        <div className="absolute inset-x-0 bottom-0 z-20 hidden translate-y-2 gap-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-10 opacity-0 transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
          <Link
            href={`/read/${book.slug}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white py-1.5 text-[11px] font-bold text-purple-950 hover:bg-purple-100"
          >
            <Play className="size-3 fill-current" /> อ่านเลย
          </Link>
          <Link
            href={`/books/${book.slug}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/30 bg-white/10 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-white/20"
          >
            <Eye className="size-3" /> รายละเอียด
          </Link>
        </div>

        {/* ปุ่มอ่านเลย (มือถือ) */}
        <Link
          href={`/read/${book.slug}`}
          aria-label={`อ่าน ${book.title}`}
          className="absolute bottom-2 right-2 z-20 flex size-8 items-center justify-center rounded-full bg-white/95 text-purple-950 shadow-md sm:hidden"
        >
          <Play className="size-3.5 fill-current" />
        </Link>
      </div>

      <BookmarkToggle
        active={bookmarked}
        onToggle={onToggleBookmark}
        title={book.title}
        className="absolute left-4 top-1.5 z-20 sm:left-5 [&_svg]:size-6 sm:[&_svg]:size-7"
      />

      <h3 className="line-clamp-2 min-h-[2.6em] text-xs font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary sm:text-sm">
        <Highlight text={book.title} query={query} />
      </h3>
      <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">
        <Highlight text={book.author} query={query} />
      </p>

      {/* ทั้งการ์ดกดไปหน้ารายละเอียด (ปุ่มด้านบนอยู่ชั้นเหนือกว่า) */}
      <Link
        href={`/books/${book.slug}`}
        aria-label={book.title}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
    </div>
  );
}

// ───────────────────────── Table ─────────────────────────

export function BookTable({
  books,
  query,
  isBookmarked,
  onToggleBookmark,
}: {
  books: BookItem[];
  query: string;
  isBookmarked: (slug: string) => boolean;
  onToggleBookmark: (slug: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <th className="w-20 px-4 py-3 font-semibold">ปก</th>
            <th className="px-4 py-3 font-semibold">ชื่อหนังสือ / ผู้แต่ง</th>
            <th className="hidden px-4 py-3 font-semibold xl:table-cell">
              หมวด DDC
            </th>
            <th className="hidden w-20 px-4 py-3 font-semibold md:table-cell">
              ประเภท
            </th>
            <th className="w-24 whitespace-nowrap px-4 py-3 text-center font-semibold">
              บุ๊กมาร์ก
            </th>
            <th className="w-48 px-4 py-3 text-right font-semibold">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-sm">
          {books.map((book) => {
            const active = isBookmarked(book.slug);
            return (
              <tr key={book.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/books/${book.slug}`}
                    className="relative block h-16 w-12 overflow-hidden rounded-md bg-muted shadow-sm"
                  >
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-950">
                        <BookOpen className="size-4 text-purple-100/60" />
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/books/${book.slug}`}
                    className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <Highlight text={book.title} query={query} />
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    <Highlight text={book.author} query={query} />
                    {book.publisher && (
                      <>
                        {" • "}
                        <Highlight text={book.publisher} query={query} />
                      </>
                    )}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground xl:table-cell">
                  {book.ddc && ddcInfo(book.ddc) && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="rounded bg-purple-500/10 px-1.5 py-px font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        {ddcInfo(book.ddc)!.code}
                      </span>
                      <span className="line-clamp-1">
                        {ddcInfo(book.ddc)!.label}
                      </span>
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {book.fileType && (
                    <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {book.fileType}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(book.slug)}
                    aria-pressed={active}
                    aria-label={`${active ? "เอาบุ๊กมาร์กออก" : "บุ๊กมาร์ก"}: ${book.title}`}
                    className="transition-transform hover:scale-110"
                  >
                    <Bookmark
                      className={`size-5 ${
                        active
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40 hover:text-amber-500"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`/read/${book.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Play className="size-3 fill-current" /> อ่าน
                    </Link>
                    <Link
                      href={`/books/${book.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      รายละเอียด
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────── Pagination ─────────────────────────

/** [1, "…", 4, 5, 6, "…", 12] */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pagination({
  currentPage,
  totalPages,
  startItem,
  endItem,
  total,
  limit,
  limitOptions,
  onPageChange,
  onLimitChange,
}: {
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  total: number;
  limit: number;
  limitOptions: number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      aria-label="เลือกหน้า"
      className="flex flex-col items-center justify-between gap-4 border-t border-border pt-5 sm:flex-row"
    >
      <p className="order-2 text-xs font-medium text-muted-foreground sm:order-1">
        แสดง {startItem.toLocaleString("th-TH")}–
        {endItem.toLocaleString("th-TH")} จาก {total.toLocaleString("th-TH")}{" "}
        เล่ม
      </p>

      <div className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
        <button
          type="button"
          className={`${btn} border border-border hover:bg-muted`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pageList(currentPage, totalPages).map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`${btn} ${
                p === currentPage
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className={`${btn} border border-border hover:bg-muted`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="size-4" />
        </button>

        <label className="relative ml-2">
          <span className="sr-only">จำนวนต่อหน้า</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-9 appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-xs font-medium hover:bg-muted/50"
          >
            {limitOptions.map((v) => (
              <option key={v} value={v}>
                {v} / หน้า
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </label>
      </div>
    </nav>
  );
}

// ───────────────────────── Empty state ─────────────────────────

export function BooksEmptyState({
  icon = "search",
  title,
  description,
  actions,
}: {
  icon?: "search" | "bookmark";
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  const Icon = icon === "bookmark" ? Bookmark : SearchX;
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <span
        className={`flex size-14 items-center justify-center rounded-2xl ${
          icon === "bookmark"
            ? "bg-amber-500/15 text-amber-500"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="size-7" />
      </span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {actions && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/** โครงการ์ดระหว่างโหลด */
export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-card p-2.5 sm:p-3"
        >
          <div className="mb-3 aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          <div className="h-3 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-2.5 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
