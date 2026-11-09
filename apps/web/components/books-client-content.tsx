"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Bookmark,
} from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import Image from "next/image";

interface Book {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  fileType?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  initialQ: string;
  initialCategory: string;
  categories: Category[];
  items: Book[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function BooksClientContent({
  initialQ,
  initialCategory,
  categories,
  items,
  total,
  totalPages,
  currentPage,
  limit,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showLimitDropdown, setShowLimitDropdown] = useState(false);

  // State บุ๊กมาร์กจาก localStorage
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [isBookmarksTab, setIsBookmarksTab] = useState(
    initialCategory === "bookmarks",
  );

  useEffect(() => {
    const saved = localStorage.getItem("bookmarked_slugs");
    if (saved) {
      try {
        setBookmarkedSlugs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam === "bookmarks" || initialCategory === "bookmarks") {
      setIsBookmarksTab(true);
    } else {
      setIsBookmarksTab(false);
    }
  }, [initialCategory, searchParams]);

  const toggleBookmark = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();

    let updated: string[];
    if (bookmarkedSlugs.includes(slug)) {
      updated = bookmarkedSlugs.filter((s) => s !== slug);
    } else {
      updated = [...bookmarkedSlugs, slug];
    }

    setBookmarkedSlugs(updated);
    localStorage.setItem("bookmarked_slugs", JSON.stringify(updated));
  };

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== initialQ) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) {
          params.set("q", searchTerm);
        } else {
          params.delete("q");
        }
        params.set("page", "1");

        startTransition(() => {
          router.push(`/books?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, initialQ, router, searchParams]);

  const handleCategoryClick = (catSlug?: string) => {
    if (catSlug === "bookmarks") {
      setIsBookmarksTab(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", "bookmarks");
      router.push(`/books?${params.toString()}`);
      return;
    }

    setIsBookmarksTab(false);
    const params = new URLSearchParams(searchParams.toString());
    if (catSlug) {
      params.set("category", catSlug);
    } else {
      params.delete("category");
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (
      newPage < 1 ||
      newPage > (isBookmarksTab ? displayTotalPages : totalPages)
    )
      return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit.toString());
    params.set("page", "1");
    setShowLimitDropdown(false);

    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  const filteredBookmarks = isBookmarksTab
    ? items.filter((book) => bookmarkedSlugs.includes(book.slug))
    : [];

  const displayTotal = isBookmarksTab ? filteredBookmarks.length : total;
  const displayTotalPages = isBookmarksTab
    ? Math.ceil(filteredBookmarks.length / limit) || 1
    : totalPages;

  const displayedItems = isBookmarksTab
    ? filteredBookmarks.slice((currentPage - 1) * limit, currentPage * limit)
    : items;

  const startItem = displayTotal === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, displayTotal);

  return (
    <div className="space-y-6">
      {/* Search Input & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อหนังสือ หรือ ผู้เขียน..."
            className="pl-9 bg-background/50 w-full"
          />
        </div>

        <div className="flex items-center border border-border rounded-xl p-1 bg-background/50 shrink-0">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-lg h-8 px-3 gap-1.5"
          >
            <LayoutGrid className="size-4" />
            <span className="text-xs">กริด</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="rounded-lg h-8 px-3 gap-1.5"
          >
            <TableIcon className="size-4" />
            <span className="text-xs">ตาราง</span>
          </Button>
        </div>
      </div>

      {/* หมวดหมู่ รวมปุ่ม บุ๊กมาร์ก */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
        <button type="button" onClick={() => handleCategoryClick(undefined)}>
          <Badge
            variant={
              !initialCategory && !isBookmarksTab ? "default" : "outline"
            }
            className="px-3 py-1.5 text-xs font-medium cursor-pointer"
          >
            ทั้งหมด
          </Badge>
        </button>

        <button type="button" onClick={() => handleCategoryClick("bookmarks")}>
          <Badge
            variant={isBookmarksTab ? "default" : "outline"}
            className={`px-3 py-1.5 text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
              isBookmarksTab
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20"
            }`}
          >
            <Bookmark
              className={`size-3.5 ${isBookmarksTab ? "fill-black text-black" : "fill-yellow-500 text-yellow-500"}`}
            />
            <span>บุ๊กมาร์ก ({bookmarkedSlugs.length})</span>
          </Badge>
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCategoryClick(c.slug)}
          >
            <Badge
              variant={
                !isBookmarksTab && initialCategory === c.slug
                  ? "default"
                  : "outline"
              }
              className="px-3 py-1.5 text-xs font-medium cursor-pointer"
            >
              {c.name}
            </Badge>
          </button>
        ))}
      </div>

      {isPending && (
        <div className="text-xs text-muted-foreground text-center py-2 animate-pulse">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* แสดงรายการหนังสือ */}
      <div className="pt-2">
        {displayedItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {isBookmarksTab
              ? "ยังไม่มีหนังสือที่บุ๊กมาร์กไว้"
              : "ไม่พบหนังสือที่คุณค้นหา"}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedItems.map((book) => {
              const isBookmarked = bookmarkedSlugs.includes(book.slug);
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="group relative flex flex-col bg-card border border-border/60 hover:border-primary/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted mb-4 shadow-sm">
                    {/* ปุ่มธงเหลืองมุมซ้ายบน */}
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(e, book.slug)}
                      className="absolute top-0 left-3 z-20 p-1 hover:scale-110 transition-transform"
                      title={
                        isBookmarked ? "เอาบุ๊กมาร์กออก" : "เพิ่มบุ๊กมาร์ก"
                      }
                    >
                      <Bookmark
                        className={`size-7 ${
                          isBookmarked
                            ? "text-yellow-500 fill-yellow-500 drop-shadow-md"
                            : "text-white/70 fill-black/20 hover:text-yellow-400"
                        }`}
                      />
                    </button>

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
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="border border-border rounded-xl overflow-hidden bg-background/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="py-3 px-4 font-semibold">บุ๊กมาร์ก</th>
                  <th className="py-3 px-4 font-semibold">ปกหนังสือ</th>
                  <th className="py-3 px-4 font-semibold">ชื่อหนังสือ</th>
                  <th className="py-3 px-4 font-semibold">ผู้แต่ง</th>
                  <th className="py-3 px-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {displayedItems.map((book) => {
                  const isBookmarked = bookmarkedSlugs.includes(book.slug);
                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 w-12 text-center">
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(e, book.slug)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Bookmark
                            className={`size-5 ${
                              isBookmarked
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-muted-foreground/40 hover:text-yellow-500"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4 w-16">
                        <div className="relative w-10 h-14 rounded overflow-hidden bg-muted">
                          {book.coverUrl ? (
                            <Image
                              src={book.coverUrl}
                              alt={book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                              ไม่มีปก
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        <Link
                          href={`/books/${book.slug}`}
                          className="hover:text-primary transition-colors line-clamp-1"
                        >
                          {" "}
                          {/* 🌟 ปรับลิงก์ในตารางไปด้วย */}
                          {book.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">
                        {book.author}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/books/${book.slug}`}>ดูรายละเอียด</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination UI */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground font-medium">
            {startItem}-{endItem} จาก {displayTotal} เล่ม
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="text-xs font-semibold px-2">
              หน้า {currentPage} จาก {displayTotalPages || 1}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= displayTotalPages}
            >
              <ChevronRight className="size-4" />
            </Button>

            <div className="relative ml-4">
              <button
                type="button"
                onClick={() => setShowLimitDropdown((prev) => !prev)}
                className="flex items-center justify-between px-3 py-1.5 text-xs border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-28"
              >
                <span>{limit} / หน้า</span>{" "}
                {/* 🌟 เปลี่ยนคำว่า page เป็น หน้า */}
                <Search className="size-3 text-muted-foreground" />
              </button>

              {showLimitDropdown && (
                <div className="absolute right-0 mt-1 w-28 bg-popover border border-border rounded-lg shadow-lg py-1 z-50 text-xs">
                  {[10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleLimitChange(val)}
                      className={`w-full flex items-center justify-between px-3 py-2 hover:bg-muted/60 transition-colors ${
                        limit === val
                          ? "text-primary font-semibold bg-primary/10"
                          : "text-popover-foreground"
                      }`}
                    >
                      <span>{val} / หน้า</span>{" "}
                      {/* 🌟 เปลี่ยนคำว่า page เป็น หน้า */}
                      {limit === val && <Check className="size-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
