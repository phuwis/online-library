import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Layers, Library } from "lucide-react";
import {
  countPublishedBooks,
  getBookFacets,
  listPublishedBooks,
} from "@/features/books/queries";
import { parseBookFilters, toSearchParams } from "@/features/books/filters";
import { listPublicCategories } from "@/features/categories/queries";
import { BooksClientContent } from "@/components/books-client-content";
import { BookshelfStrip } from "@/components/bookshelf-strip";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "หนังสือทั้งหมด | ห้องสมุดกระทรวงมหาดไทย",
  description:
    "ค้นหาและเลือกอ่านหนังสือ ตำรา และเอกสารวิชาการของกระทรวงมหาดไทย",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // ตรวจค่าทุกตัวใน URL (ค่าที่ไม่ถูกต้องถูกตัด/ปรับเป็นค่าเริ่มต้น)
  const filters = parseBookFilters(await searchParams);
  const isBookmarkView = filters.category === "bookmarks";

  const [list, facets, categories, totalBooks] = await Promise.all([
    // แท็บบุ๊กมาร์ก: ฝั่ง client ดึงหนังสือตาม slug ที่บันทึกไว้เอง
    isBookmarkView ? null : listPublishedBooks(filters),
    getBookFacets(filters),
    listPublicCategories(),
    countPublishedBooks(),
  ]);

  // ขอหน้าที่เกินจำนวนหน้าจริง → พาไปหน้าสุดท้าย
  if (list && list.total > 0 && filters.page > list.totalPages) {
    redirect(`/books?${toSearchParams({ ...filters, page: list.totalPages })}`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 md:px-8">
      {/* หัวหน้า */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-[#2a0f45] to-indigo-950 px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9">
        <div
          aria-hidden
          className="absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-purple-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 left-1/3 -z-10 size-72 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <BookshelfStrip
          seed={12}
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-12 w-full opacity-30"
        />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <Link
              href="/"
              aria-label="กลับหน้าแรก"
              className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 sm:size-10"
            >
              <ArrowLeft className="size-4 sm:size-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                คลังหนังสือทั้งหมด
              </h1>
              <p className="mt-1 text-sm text-purple-100/80">
                ค้นหาจากชื่อหนังสือ ผู้แต่ง สำนักพิมพ์ หรือรหัสหนังสือ
                แล้วกรองตามหมวดหมู่ที่สนใจ
              </p>
            </div>
          </div>
          <div className="flex gap-2 pl-12 sm:pl-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <Library className="size-3.5 text-amber-300" />
              {totalBooks.toLocaleString("th-TH")} เล่ม
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <Layers className="size-3.5 text-amber-300" />
              {categories.length} หมวดหมู่
            </span>
          </div>
        </div>
      </section>

      <BooksClientContent
        filters={filters}
        facets={facets}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        items={list?.items ?? []}
        total={list?.total ?? 0}
        totalPages={list?.totalPages ?? 1}
      />
    </div>
  );
}
