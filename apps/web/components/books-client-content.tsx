"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownUp,
  Bookmark,
  LayoutGrid,
  Loader2,
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  X,
} from "lucide-react";
import {
  useBookmarks,
  useBooksBySlugs,
} from "@/features/library/local-library";
import {
  countAdvancedFilters,
  ddcInfo,
  LIMIT_OPTIONS,
  SORT_OPTIONS,
  toSearchParams,
  type BookFacets,
  type BookFilters,
  type SortValue,
} from "@/features/books/filters";
import {
  BookGridCard,
  BookTable,
  BooksEmptyState,
  GridSkeleton,
  Pagination,
  type BookItem,
} from "@/components/books/book-list-ui";
import { FilterPanel, FilterSheet } from "@/components/books/book-filters";

type Category = { id: string; name: string; slug: string };

interface Props {
  filters: BookFilters;
  facets: BookFacets;
  categories: Category[];
  items: BookItem[];
  total: number;
  totalPages: number;
}

type ViewMode = "grid" | "table";
const VIEW_KEY = "books_view_mode";

export function BooksClientContent({
  filters,
  facets,
  categories,
  items,
  total,
  totalPages,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState(filters.q);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sheetOpen, setSheetOpen] = useState(false);

  const isBookmarksTab = filters.category === "bookmarks";
  const activeCategory = categories.find((c) => c.slug === filters.category);
  const advancedCount = countAdvancedFilters(filters);

  // บุ๊กมาร์ก: hook กลาง (ซิงก์กับหน้าแรก/หน้ารายละเอียดอัตโนมัติ)
  const { slugs: bookmarkSlugs, isBookmarked, toggle } = useBookmarks();
  const bookmarkFetch = useBooksBySlugs(isBookmarksTab ? bookmarkSlugs : []);

  // ───────── จำมุมมองกริด/ตาราง ─────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "grid" || saved === "table") setViewMode(saved);
    } catch {
      /* ignore */
    }
  }, []);
  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  // ───────── เปลี่ยนตัวกรอง → เปลี่ยน URL (หน้า server ดึงข้อมูลใหม่) ─────────
  const apply = useCallback(
    (
      patch: Partial<BookFilters>,
      { replace = false, scrollToResults = false } = {},
    ) => {
      // เปลี่ยนตัวกรองใดๆ = กลับไปหน้า 1 (ยกเว้นสั่งเปลี่ยนหน้าเอง)
      const next: BookFilters = { ...filters, page: 1, ...patch };
      const qs = toSearchParams(next).toString();
      const url = qs ? `/books?${qs}` : "/books";
      startTransition(() => {
        if (replace) router.replace(url, { scroll: false });
        else router.push(url, { scroll: false });
      });
      if (scrollToResults) {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    [filters, router],
  );

  // ค้นหาแบบหน่วงเวลา 300ms — ใช้ replace ไม่ให้ประวัติย้อนกลับรก
  useEffect(() => {
    const term = searchTerm.trim();
    if (term === filters.q) return;
    const timer = setTimeout(() => apply({ q: term }, { replace: true }), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.q, apply]);

  // q ใน URL เปลี่ยนจากภายนอก (ย้อนกลับ / ล้างตัวกรอง) → อัปเดตช่องค้นหา ถ้าไม่ได้พิมพ์อยู่
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setSearchTerm(filters.q);
  }, [filters.q]);

  // กด "/" เพื่อไปที่ช่องค้นหา
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing =
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clearAdvanced = () =>
    apply({ ddc: [], type: "", publisher: [], province: [], year: [] });
  const clearAll = () => {
    setSearchTerm("");
    apply({
      q: "",
      category: "",
      ddc: [],
      type: "",
      publisher: [],
      province: [],
      year: [],
    });
  };

  // ───────── ข้อมูลที่แสดง ─────────
  const query = filters.q;
  const limit = filters.limit;

  const bookmarkMatches = useMemo(() => {
    if (!isBookmarksTab) return [];
    const q = query.toLowerCase();
    const current = new Set(bookmarkSlugs ?? []);
    return (bookmarkFetch.books ?? []).filter(
      (b) =>
        current.has(b.slug) &&
        (!q ||
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)),
    );
  }, [isBookmarksTab, bookmarkFetch.books, bookmarkSlugs, query]);

  const displayTotal = isBookmarksTab ? bookmarkMatches.length : total;
  const displayTotalPages = isBookmarksTab
    ? Math.max(1, Math.ceil(bookmarkMatches.length / limit))
    : totalPages;
  const page = Math.min(filters.page, displayTotalPages);
  const displayedItems = isBookmarksTab
    ? bookmarkMatches.slice((page - 1) * limit, page * limit)
    : items;
  const startItem = displayTotal === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, displayTotal);

  const bookmarksLoading =
    isBookmarksTab && (bookmarkSlugs === null || bookmarkFetch.books === null);
  const isSearching = isPending && searchTerm.trim() !== filters.q;
  const categoryCount = (slug: string) =>
    facets.category.find((c) => c.value === slug)?.count ?? 0;

  // ชิปตัวกรองที่ใช้อยู่ (กด ✕ เพื่อเอาออกทีละตัว)
  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...(query
      ? [
          {
            key: "q",
            label: `คำค้น: “${query}”`,
            remove: () => setSearchTerm(""),
          },
        ]
      : []),
    ...(isBookmarksTab || activeCategory
      ? [
          {
            key: "cat",
            label: `หมวด: ${isBookmarksTab ? "บุ๊กมาร์กของฉัน" : activeCategory!.name}`,
            remove: () => apply({ category: "" }),
          },
        ]
      : []),
    ...filters.ddc.map((d) => ({
      key: `ddc-${d}`,
      label: `DDC ${ddcInfo(d)?.code} ${ddcInfo(d)?.label}`,
      remove: () => apply({ ddc: filters.ddc.filter((x) => x !== d) }),
    })),
    ...(filters.type
      ? [
          {
            key: "type",
            label: `ไฟล์: ${filters.type}`,
            remove: () => apply({ type: "" }),
          },
        ]
      : []),
    ...filters.publisher.map((p) => ({
      key: `pub-${p}`,
      label: `สำนักพิมพ์: ${p}`,
      remove: () =>
        apply({ publisher: filters.publisher.filter((x) => x !== p) }),
    })),
    ...filters.province.map((p) => ({
      key: `prov-${p}`,
      label: `จังหวัด: ${p}`,
      remove: () =>
        apply({ province: filters.province.filter((x) => x !== p) }),
    })),
    ...filters.year.map((y) => ({
      key: `year-${y}`,
      label: `ปี ${y}`,
      remove: () => apply({ year: filters.year.filter((x) => x !== y) }),
    })),
  ];

  const panel = (
    <FilterPanel
      filters={filters}
      facets={facets}
      onChange={(patch) => apply(patch)}
      disabledReason={
        isBookmarksTab
          ? "ตัวกรองนี้ใช้กับคลังหนังสือทั้งหมด ในแท็บบุ๊กมาร์กค้นหาจากช่องค้นหาได้"
          : undefined
      }
    />
  );

  return (
    <div className="space-y-5">
      {/* ───────── แถบค้นหา + หมวดหมู่ (ติดด้านบนเมื่อเลื่อน) ───────── */}
      <div className="sticky top-16 z-30 -mx-3 border-b border-border/60 bg-background/85 px-3 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-4 sm:shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchTerm("");
              }}
              placeholder="ค้นหาชื่อหนังสือ ผู้แต่ง สำนักพิมพ์ หรือรหัสหนังสือ…"
              aria-label="ค้นหาหนังสือ"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-20 text-sm shadow-inner outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-4 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {isSearching && (
                <Loader2 className="size-4 animate-spin text-primary" />
              )}
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    inputRef.current?.focus();
                  }}
                  aria-label="ล้างคำค้นหา"
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* ปุ่มเปิดตัวกรอง (จอเล็กกว่า lg) */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:bg-muted lg:hidden"
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">ตัวกรอง</span>
            {advancedCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {advancedCount}
              </span>
            )}
          </button>

          {/* มุมมอง (ซ่อนบนมือถือ ใช้กริดเสมอ) */}
          <div
            role="radiogroup"
            aria-label="มุมมอง"
            className="hidden shrink-0 items-center rounded-xl border border-border bg-card p-1 sm:flex"
          >
            {(
              [
                ["grid", LayoutGrid, "กริด"],
                ["table", TableIcon, "ตาราง"],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={viewMode === mode}
                onClick={() => changeView(mode)}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${
                  viewMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* หมวดหมู่: มือถือเลื่อนแนวนอน / จอกว้างขึ้นบรรทัดใหม่ */}
        <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          <CategoryChip
            active={!filters.category}
            onClick={() => apply({ category: "" })}
            label="ทั้งหมด"
            count={facets.categoryAll}
          />
          <CategoryChip
            active={isBookmarksTab}
            onClick={() => apply({ category: "bookmarks" })}
            label="บุ๊กมาร์กของฉัน"
            count={bookmarkSlugs?.length ?? 0}
            tone="gold"
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              active={filters.category === c.slug}
              onClick={() => apply({ category: c.slug })}
              label={c.name}
              count={categoryCount(c.slug)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        {/* ───────── แผงตัวกรอง (จอกว้าง) ───────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-48 max-h-[calc(100dvh-13rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm [scrollbar-width:thin]">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <SlidersHorizontal className="size-4 text-primary" />
                ตัวกรอง
              </h2>
              {advancedCount > 0 && (
                <button
                  type="button"
                  onClick={clearAdvanced}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
                >
                  ล้างทั้งหมด ({advancedCount})
                </button>
              )}
            </div>
            {panel}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {/* ───────── สรุปผล + ตัวกรองที่ใช้อยู่ + เรียงลำดับ ───────── */}
          <div ref={resultsRef} className="scroll-mt-48 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                {bookmarksLoading ? (
                  "กำลังโหลดบุ๊กมาร์ก…"
                ) : (
                  <>
                    พบ{" "}
                    <span className="text-primary">
                      {displayTotal.toLocaleString("th-TH")}
                    </span>{" "}
                    เล่ม
                  </>
                )}
              </p>
              {!isBookmarksTab && (
                <label className="relative flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ArrowDownUp className="size-3.5" />
                  <span className="sr-only sm:not-sr-only">เรียงตาม</span>
                  <select
                    value={filters.sort}
                    onChange={(e) =>
                      apply({ sort: e.target.value as SortValue })
                    }
                    className="h-9 rounded-lg border border-border bg-card pl-3 pr-8 text-xs font-semibold text-foreground"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeChips.map((c) => (
                  <FilterChip key={c.key} label={c.label} onRemove={c.remove} />
                ))}
                {activeChips.length > 1 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="ml-1 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ───────── รายการหนังสือ ───────── */}
          <div
            aria-busy={isPending}
            className={`relative transition-opacity duration-200 ${isPending ? "opacity-50" : ""}`}
          >
            {isPending && (
              <div className="pointer-events-none absolute inset-x-0 -top-2 z-10 h-0.5 overflow-hidden rounded-full bg-primary/15">
                <div className="h-full w-full animate-pulse rounded-full bg-primary/70" />
              </div>
            )}

            {bookmarksLoading ? (
              <GridSkeleton count={8} />
            ) : displayedItems.length === 0 ? (
              isBookmarksTab && (bookmarkSlugs?.length ?? 0) === 0 ? (
                <BooksEmptyState
                  icon="bookmark"
                  title="ยังไม่มีหนังสือที่บุ๊กมาร์กไว้"
                  description="กดริบบิ้นที่มุมปกหนังสือเพื่อเก็บเล่มที่สนใจไว้ที่นี่ แล้วกลับมาอ่านได้ทุกเมื่อ"
                  actions={
                    <ActionButton onClick={() => apply({ category: "" })}>
                      ดูหนังสือทั้งหมด
                    </ActionButton>
                  }
                />
              ) : (
                <BooksEmptyState
                  title={
                    query
                      ? `ไม่พบหนังสือที่ตรงกับ “${query}”`
                      : "ไม่พบหนังสือตามตัวกรองที่เลือก"
                  }
                  description={
                    query
                      ? "ลองใช้คำที่สั้นลง ตรวจการสะกด หรือค้นจากชื่อผู้แต่ง/สำนักพิมพ์แทน"
                      : "ลองเอาตัวกรองบางตัวออก หรือเลือกหมวดหมู่อื่น"
                  }
                  actions={
                    <>
                      {query && (
                        <ActionButton onClick={() => setSearchTerm("")}>
                          ล้างคำค้นหา
                        </ActionButton>
                      )}
                      {advancedCount > 0 && (
                        <ActionButton variant="outline" onClick={clearAdvanced}>
                          ล้างตัวกรอง ({advancedCount})
                        </ActionButton>
                      )}
                      {filters.category && (
                        <ActionButton
                          variant="outline"
                          onClick={() => apply({ category: "" })}
                        >
                          ดูทุกหมวดหมู่
                        </ActionButton>
                      )}
                    </>
                  }
                />
              )
            ) : viewMode === "table" ? (
              <>
                <div className="hidden sm:block">
                  <BookTable
                    books={displayedItems}
                    query={query}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={toggle}
                  />
                </div>
                {/* มือถือ: ใช้กริดแทนตาราง */}
                <div className="sm:hidden">
                  <Grid
                    items={displayedItems}
                    query={query}
                    isBookmarked={isBookmarked}
                    toggle={toggle}
                  />
                </div>
              </>
            ) : (
              <Grid
                items={displayedItems}
                query={query}
                isBookmarked={isBookmarked}
                toggle={toggle}
              />
            )}
          </div>

          {/* ───────── แบ่งหน้า ───────── */}
          {displayTotal > 0 && !bookmarksLoading && (
            <Pagination
              currentPage={page}
              totalPages={displayTotalPages}
              startItem={startItem}
              endItem={endItem}
              total={displayTotal}
              limit={limit}
              limitOptions={[...LIMIT_OPTIONS]}
              onPageChange={(n) => {
                if (n < 1 || n > displayTotalPages || n === page) return;
                apply({ page: n }, { scrollToResults: true });
              }}
              onLimitChange={(n) => apply({ limit: n })}
            />
          )}

          {isBookmarksTab && (bookmarkSlugs?.length ?? 0) > 0 && (
            <p className="text-center text-[11px] text-muted-foreground">
              บุ๊กมาร์กเก็บไว้ในเบราว์เซอร์นี้เท่านั้น •{" "}
              <Link href="/" className="underline-offset-2 hover:underline">
                ดูบนหน้าแรก
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ───────── แผ่นตัวกรอง (มือถือ/แท็บเล็ต) ───────── */}
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onClearAll={clearAdvanced}
        activeCount={advancedCount}
        resultCount={displayTotal}
      >
        {panel}
      </FilterSheet>
    </div>
  );
}

function Grid({
  items,
  query,
  isBookmarked,
  toggle,
}: {
  items: BookItem[];
  query: string;
  isBookmarked: (slug: string) => boolean;
  toggle: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4">
      {items.map((book) => (
        <BookGridCard
          key={book.id}
          book={book}
          query={query}
          bookmarked={isBookmarked(book.slug)}
          onToggleBookmark={() => toggle(book.slug)}
        />
      ))}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
  tone = "default",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "default" | "gold";
}) {
  const styles =
    tone === "gold"
      ? active
        ? "border-amber-500 bg-amber-400 text-black shadow-sm"
        : "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
      : active
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${styles} ${
        !active && count === 0 && tone === "default" ? "opacity-50" : ""
      }`}
    >
      {tone === "gold" && (
        <Bookmark
          className={`size-3.5 ${active ? "fill-black" : "fill-amber-500 text-amber-500"}`}
        />
      )}
      {label}
      <span
        className={`rounded-full px-1.5 py-px text-[10px] ${active ? "bg-black/15" : "bg-muted text-muted-foreground"}`}
      >
        {count.toLocaleString("th-TH")}
      </span>
    </button>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 py-1 pl-3 pr-1 text-xs font-medium text-foreground">
      <span className="max-w-[16rem] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`ลบตัวกรอง ${label}`}
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/15 hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
