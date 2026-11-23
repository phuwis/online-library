"use client";

/**
 * ส่วนที่โต้ตอบได้ของหน้ารายละเอียดหนังสือ
 * - ReadButton / ReadProgress: ปุ่มอ่าน (จำตำแหน่งที่อ่านค้าง → "อ่านต่อหน้า X") และแถบความคืบหน้า
 * - CopyButton: คัดลอกข้อความ (รหัสหนังสือ)
 * - ShareButton: แชร์ลิงก์ (มือถือใช้เมนูแชร์ของระบบ, จอคอมคัดลอกลิงก์)
 * - MobileReadBar: แถบปุ่มอ่านด้านล่างจอ (มือถือ) ซ่อนเมื่อเลื่อนถึง footer
 * - RelatedBooks: กริดหนังสือที่เกี่ยวข้อง
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { BookOpen, Check, Copy, Play, Share2 } from "lucide-react";
import {
  useBookmarks,
  useReadingHistory,
} from "@/features/library/local-library";
import { BookGridCard, type BookItem } from "@/components/books/book-list-ui";

function useReadingEntry(slug: string) {
  const { entries } = useReadingHistory();
  const entry = entries?.find((e) => e.slug === slug) ?? null;
  const percent = entry?.totalPages
    ? Math.min(100, Math.round((entry.page / entry.totalPages) * 100))
    : null;
  return { entry, percent };
}

export function ReadButton({ slug }: { slug: string }) {
  const { entry } = useReadingEntry(slug);
  return (
    <Link
      href={`/read/${slug}`}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-400 px-6 text-sm font-bold text-purple-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-300"
    >
      {entry ? (
        <Play className="size-4 fill-current" />
      ) : (
        <BookOpen className="size-4" />
      )}
      {entry ? `อ่านต่อหน้า ${entry.page}` : "เริ่มอ่านหนังสือ"}
    </Link>
  );
}

/** แถบความคืบหน้าการอ่าน (แสดงเมื่อเคยอ่านเล่มนี้แล้ว) */
export function ReadProgress({ slug }: { slug: string }) {
  const { entry, percent } = useReadingEntry(slug);
  if (!entry) return null;
  return (
    <div className="flex items-center justify-center gap-2 text-[11px] text-purple-100/80 md:justify-start">
      {percent !== null && (
        <span
          className="h-1.5 w-32 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`อ่านแล้ว ${percent}%`}
        >
          <span
            className="block h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400"
            style={{ width: `${Math.max(percent, 3)}%` }}
          />
        </span>
      )}
      <span>
        {percent !== null ? `อ่านแล้ว ${percent}% • ` : ""}หน้า {entry.page}
        {entry.totalPages ? ` จาก ${entry.totalPages}` : ""}
      </span>
    </div>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* เบราว์เซอร์ไม่อนุญาต: ไม่ต้องทำอะไร */
        }
      }}
      aria-label={label}
      title={done ? "คัดลอกแล้ว" : label}
      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {done ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (
            navigator.share &&
            window.matchMedia("(pointer: coarse)").matches
          ) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* ผู้ใช้ยกเลิกการแชร์ */
        }
      }}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15"
    >
      {copied ? (
        <Check className="size-4 text-emerald-300" />
      ) : (
        <Share2 className="size-4" />
      )}
      {copied ? "คัดลอกลิงก์แล้ว" : "แชร์"}
    </button>
  );
}

export function MobileReadBar({
  slug,
  title,
  author,
}: {
  slug: string;
  title: string;
  author: string;
}) {
  const { entry } = useReadingEntry(slug);
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    // ซ่อนเมื่อ footer โผล่ จะได้ไม่บังข้อมูลติดต่อ
    const io = new IntersectionObserver(([e]) => setHidden(e!.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  if (!mounted) return null;

  // portal ไปที่ <body>: <main> อาจโดนใส่ filter (เอฟเฟกต์ footer) ซึ่งทำให้ position: fixed เพี้ยน
  return createPortal(
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 p-3 shadow-2xl backdrop-blur-md transition-transform duration-300 md:hidden ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 px-1">
          <p className="truncate text-xs font-bold text-foreground">{title}</p>
          <p className="truncate text-[10px] text-muted-foreground">{author}</p>
        </div>
        <Link
          href={`/read/${slug}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md"
        >
          {entry ? (
            <Play className="size-3.5 fill-current" />
          ) : (
            <BookOpen className="size-4" />
          )}
          {entry ? `อ่านต่อหน้า ${entry.page}` : "เริ่มอ่าน"}
        </Link>
      </div>
    </div>,
    document.body,
  );
}

export function RelatedBooks({ books }: { books: BookItem[] }) {
  const { isBookmarked, toggle } = useBookmarks();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4">
      {books.map((b) => (
        <BookGridCard
          key={b.id}
          book={b}
          query=""
          bookmarked={isBookmarked(b.slug)}
          onToggleBookmark={() => toggle(b.slug)}
        />
      ))}
    </div>
  );
}
