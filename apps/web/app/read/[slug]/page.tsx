"use client";

import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MoreVertical,
  Clock,
  Bookmark,
  Download,
  Check,
  RotateCw,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  saveTotalPages,
  touchLastRead,
  useBookmarks,
} from "@/features/library/local-library";

// โหลดผ่าน @/lib/pdf เสมอ → workerSrc ถูกตั้งก่อน <Document> เริ่มทำงาน (และเป็น legacy build ที่ iPhone รุ่นเก่าเปิดได้)
const Document = dynamic(() => import("@/lib/pdf").then((m) => m.Document), {
  ssr: false,
});
const Page = dynamic(() => import("@/lib/pdf").then((m) => m.Page), {
  ssr: false,
});
const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false,
}) as any;

// ───────────────────────── ค่าตั้งต้น ─────────────────────────

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;
/** render canvas เฉพาะหน้ารอบ ๆ หน้าปัจจุบัน (iOS Safari จำกัดหน่วยความจำ canvas รวมทั้งแท็บ) */
const RENDER_BEHIND = 2;
const RENDER_AHEAD = 3;
/** อัตราส่วนกว้าง/สูงตั้งต้น (A5/A4 โดยประมาณ) ก่อนอ่านขนาดจริงจากหน้าแรก */
const DEFAULT_ASPECT = 400 / 560;
/** ต้องเป็น reference เดิมทุกครั้ง ไม่งั้น react-pdf จะโหลดไฟล์ใหม่ */
const PDF_OPTIONS = { disableAutoFetch: true };

const clampZoom = (z: number) =>
  Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) * 100) / 100;

function readNumber(key: string): number {
  try {
    const n = parseInt(localStorage.getItem(key) ?? "", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Safari private mode / storage เต็ม → ข้ามไป
  }
}

type ReaderBook = {
  title: string;
  author?: string | null;
  fileUrl: string;
};

type PdfLike = {
  numPages: number;
  getPage: (n: number) => Promise<{
    getViewport: (o: { scale: number }) => { width: number; height: number };
  }>;
};

// ───────────────────────── hooks ─────────────────────────

/** ขนาดของ element (debounce เล็กน้อย กัน flipbook mount ใหม่ถี่ ๆ ตอนหมุนจอ) */
function useElementSize() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      const width = Math.floor(el.clientWidth);
      const height = Math.floor(el.clientHeight);
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    };
    measure();
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(measure, 120);
    });
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [el]);

  return [setEl, size] as const;
}

// ───────────────────────── ตัวจับเวลา (แยก component) ─────────────────────────

/**
 * แยกออกมาเพื่อให้ re-render แค่ตัวเลขทุกวินาที ไม่ใช่ทั้งหน้าอ่าน + flipbook
 * และหยุดนับเมื่อสลับแอป/ล็อกจอ
 */
function ReadingTimer({ slug }: { slug: string }) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const key = `book_time_${slug}`;
    let current = readNumber(key);
    setSeconds(current);
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      current += 1;
      writeNumber(key, current);
      setSeconds(current);
    }, 1000);
    return () => clearInterval(timer);
  }, [slug]);

  const s = seconds ?? 0;
  const mins = Math.floor(s / 60);
  const secs = s % 60;

  return (
    <div className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-zinc-400">
      <Clock className="size-3.5" />
      <span>
        {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

// ───────────────────────── หน้าอ่าน ─────────────────────────

export default function BookReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [book, setBook] = useState<ReaderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // หน้าปัจจุบัน: อ่าน localStorage ใน effect (อ่านใน useState ทำให้ hydration ไม่ตรงกัน)
  const [pageNumber, setPageNumber] = useState(1);
  const [restored, setRestored] = useState(false);
  const [sliderDraft, setSliderDraft] = useState<number | null>(null);

  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;

  const [baseDpr, setBaseDpr] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<any>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(slug);

  const [setStageEl, stage] = useElementSize();

  // ── โหลดข้อมูลเริ่มต้น ──
  useEffect(() => {
    const saved = readNumber(`book_page_${slug}`);
    if (saved > 0) setPageNumber(saved);
    setRestored(true);
    setBaseDpr(window.devicePixelRatio || 1);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/books/${slug}`);
        const data = await res.json();
        if (!cancelled && data.success) setBook(data.book);
      } catch (error) {
        console.error("Failed to fetch book:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── ปิดเมนูเมื่อแตะนอกพื้นที่ (pointerdown ใช้ได้ทั้งเมาส์และนิ้วบน iOS) ──
  useEffect(() => {
    if (!showMenu) return;
    const onDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [showMenu]);

  // ── ขนาดหน้า: คำนวณจากพื้นที่จริงของจอ + สัดส่วนจริงของ PDF ──
  // หน้าเดี่ยว: จอแคบ (มือถือ) หรือจอแนวตั้งที่หน้าเดี่ยวได้ขนาดใหญ่กว่าชัดเจน (iPad แนวตั้ง)
  const layout = useMemo(() => {
    if (!stage.width || !stage.height) return null;
    const ratio = aspect ?? DEFAULT_ASPECT;
    const availH = Math.max(200, stage.height - 16);
    const singleW = Math.min(
      stage.width - (stage.width < 768 ? 8 : 128),
      availH * ratio,
    );
    const doubleW = Math.min((stage.width - 128) / 2, availH * ratio);
    const portrait = stage.width < 768 || singleW > doubleW * 1.2;
    const pageW = Math.max(
      120,
      Math.floor((portrait ? singleW : doubleW) / 4) * 4,
    );
    const pageH = Math.floor(pageW / ratio);
    return { pageW, pageH, bookW: portrait ? pageW : pageW * 2, portrait };
  }, [stage.width, stage.height, aspect]);
  const portrait = layout?.portrait ?? false;
  const narrow = stage.width > 0 && stage.width < 768;

  // ความละเอียด canvas: จำกัดบนมือถือ, เพิ่มเมื่อซูม (เป็นขั้น ๆ เพื่อไม่ต้องวาดใหม่ทุกครั้งที่ pinch)
  const renderBoost = zoom >= 1.75 ? 2 : zoom > 1.25 ? 1.5 : 1;
  const dpr = Math.min(
    Math.min(baseDpr, narrow ? 2 : 2.5) * renderBoost,
    narrow ? 3 : 4,
  );

  // ── เอกสารโหลดเสร็จ ──
  const onDocumentLoadSuccess = useCallback(
    async (pdf: PdfLike) => {
      setNumPages(pdf.numPages);
      setPageNumber((p) => Math.min(Math.max(1, p), pdf.numPages));
      saveTotalPages(slug, pdf.numPages);
      touchLastRead(slug);
      let ratio = DEFAULT_ASPECT;
      try {
        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        if (vp.width > 0 && vp.height > 0) ratio = vp.width / vp.height;
      } catch {
        // ใช้ค่าตั้งต้น
      }
      setAspect(ratio);
    },
    [slug],
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("[Reader] PDF load error:", error);
  }, []);

  // ── เปลี่ยนหน้า ──
  const onPageFlip = useCallback(
    (e: { data: number }) => {
      const page = e.data + 1;
      setPageNumber(page);
      writeNumber(`book_page_${slug}`, page);
      touchLastRead(slug);
    },
    [slug],
  );

  const flipPrev = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev();
  }, []);
  const flipNext = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext();
  }, []);

  // ปุ่มลูกศรบนคีย์บอร์ด
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") flipPrev();
      if (e.key === "ArrowRight") flipNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipPrev, flipNext]);

  // slider: ลากแล้วค่อยเปลี่ยนหน้าเมื่อหยุด (ไม่สั่ง flipbook ทุก pixel)
  useEffect(() => {
    if (sliderDraft === null) return;
    const t = setTimeout(() => {
      bookRef.current?.pageFlip()?.turnToPage(sliderDraft - 1);
      setPageNumber(sliderDraft);
      writeNumber(`book_page_${slug}`, sliderDraft);
      setSliderDraft(null);
    }, 150);
    return () => clearTimeout(t);
  }, [sliderDraft, slug]);

  // ── ซูม ──
  // คงจุดกึ่งกลางที่กำลังดูไว้เมื่อซูมเข้า/ออก
  const prevZoomRef = useRef(1);
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const prev = prevZoomRef.current;
    prevZoomRef.current = zoom;
    if (!vp || prev === zoom) return;
    const cx = (vp.scrollLeft + vp.clientWidth / 2) / prev;
    const cy = (vp.scrollTop + vp.clientHeight / 2) / prev;
    vp.scrollLeft = cx * zoom - vp.clientWidth / 2;
    vp.scrollTop = cy * zoom - vp.clientHeight / 2;
  }, [zoom]);

  // ctrl + wheel (trackpad pinch บน Mac) และ pinch บน iPhone/iPad (gesture events ของ Safari)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => clampZoom(z - e.deltaY * 0.01));
    };
    let startZoom = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      startZoom = zoomRef.current;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const scale = (e as Event & { scale?: number }).scale ?? 1;
      setZoom(clampZoom(startZoom * scale));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("gesturestart", onGestureStart, { passive: false });
    window.addEventListener("gesturechange", onGestureChange, {
      passive: false,
    });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("gesturestart", onGestureStart);
      window.removeEventListener("gesturechange", onGestureChange);
    };
  }, []);

  // ── การสัมผัส/เมาส์บนพื้นที่อ่าน ──
  // ซูม 100%: ปัดซ้าย/ขวา หรือแตะขอบซ้าย/ขวาเพื่อเปลี่ยนหน้า
  // ซูม > 100%: นิ้วเลื่อนดูด้วย native scroll, เมาส์ลากเพื่อเลื่อน
  const gestureRef = useRef<{
    x: number;
    y: number;
    t: number;
    left: number;
    top: number;
    mouse: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const vp = viewportRef.current;
    const mouse = e.pointerType === "mouse";
    if (mouse && (e.button !== 0 || zoom <= 1)) return;
    if (!mouse && zoom > 1) return;
    gestureRef.current = {
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      left: vp?.scrollLeft ?? 0,
      top: vp?.scrollTop ?? 0,
      mouse,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    const vp = viewportRef.current;
    if (!g?.mouse || !vp) return;
    vp.scrollLeft = g.left - (e.clientX - g.x);
    vp.scrollTop = g.top - (e.clientY - g.y);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g || g.mouse) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const dt = Date.now() - g.t;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) flipNext();
      else flipPrev();
      return;
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350) {
      const rect = e.currentTarget.getBoundingClientRect();
      const rel = (e.clientX - rect.left) / rect.width;
      if (rel < 0.3) flipPrev();
      else if (rel > 0.7) flipNext();
    }
  };

  // ── หน้าทั้งหมดของ flipbook (memo → ไม่ต้องสร้างใหม่ทุก render) ──
  const currentIndex = pageNumber - 1;
  const pages = useMemo(() => {
    if (!layout || numPages === 0) return null;
    const { pageW, pageH } = layout;
    return Array.from({ length: numPages }, (_, i) => {
      const near =
        i >= currentIndex - RENDER_BEHIND && i <= currentIndex + RENDER_AHEAD;
      return (
        <div
          key={i}
          className="relative overflow-hidden bg-white"
          style={{ width: pageW, height: pageH }}
        >
          <div className="flex h-full w-full items-center justify-center">
            {near ? (
              <Page
                pageNumber={i + 1}
                width={pageW}
                devicePixelRatio={dpr}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<div style={{ width: pageW, height: pageH }} />}
              />
            ) : (
              <span className="text-xs text-zinc-300">{i + 1}</span>
            )}
          </div>
        </div>
      );
    });
  }, [layout, numPages, currentIndex, dpr]);

  const ready = restored && layout !== null && aspect !== null && pages;
  const shownPage = sliderDraft ?? pageNumber;
  const progressPercent =
    numPages > 0 ? Math.round((shownPage / numPages) * 100) : 0;
  const atEnd = pageNumber + (portrait ? 0 : 1) >= numPages;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950 text-white">
        กำลังโหลดข้อมูลหนังสือ...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950 text-white">
        ไม่พบข้อมูลหนังสือ
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex select-none flex-col gap-1 overflow-hidden overscroll-none bg-zinc-950 p-2 text-foreground md:p-4">
      {/* Header */}
      <header className="z-50 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2 shadow-sm sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link href={`/books/${slug}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="ย้อนกลับ"
              className="shrink-0 text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex min-w-0 flex-col">
            <h1 className="line-clamp-2 break-words text-xs font-semibold leading-snug text-gray-100 md:text-sm">
              {book.title}
            </h1>
            {book.author && (
              <p className="truncate text-[11px] text-zinc-400">
                {book.author}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <span className="hidden text-sm tabular-nums text-zinc-300 sm:inline">
            หน้า {shownPage} / {numPages || "?"}
          </span>
          <div className="flex items-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              aria-label="ซูมออก"
              className="h-8 w-8 rounded-none text-white hover:bg-zinc-700 disabled:opacity-40"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="hidden w-11 text-center text-xs tabular-nums text-zinc-300 sm:inline">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="ซูมเข้า"
              className="h-8 w-8 rounded-none text-white hover:bg-zinc-700 disabled:opacity-40"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>

          {/* เมนูสามจุด (บุ๊กมาร์กเล่ม + ปุ่ม Download ที่ Disable ไว้) */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="เมนู"
              className="text-white hover:bg-zinc-800"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <MoreVertical className="size-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-700 bg-zinc-900 py-1 text-xs shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    toggleBookmark(slug);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-zinc-200 hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <Bookmark
                      className={`size-4 ${bookmarked ? "fill-yellow-500 text-yellow-500" : ""}`}
                    />
                    <span>
                      {bookmarked
                        ? "เอาบุ๊กมาร์กหนังสือออก"
                        : "บุ๊กมาร์กหนังสือเล่มนี้"}
                    </span>
                  </div>
                  {bookmarked && <Check className="size-3.5 text-yellow-500" />}
                </button>

                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center gap-2.5 border-t border-zinc-800 px-4 py-2.5 text-zinc-500"
                >
                  <Download className="size-4" />
                  <span>ดาวน์โหลดเอกสาร</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        ref={setStageEl}
        className="relative min-h-0 w-full flex-1 overflow-hidden"
      >
        <Button
          variant="outline"
          size="icon"
          aria-label="หน้าก่อนหน้า"
          className="absolute left-2 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 rounded-full border-zinc-700 bg-zinc-900 text-white shadow-md hover:bg-zinc-800 md:left-8 md:flex"
          onClick={flipPrev}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (gestureRef.current = null)}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") gestureRef.current = null;
          }}
          className={`absolute inset-0 flex ${zoom > 1 ? "overflow-auto cursor-grab active:cursor-grabbing" : "overflow-hidden"}`}
          style={{
            // ซูม 100%: เราจัดการ gesture เอง / ซูมแล้ว: ให้นิ้วเลื่อนดูได้ตามปกติ
            touchAction: zoom > 1 ? "pan-x pan-y" : "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Document
            key={reloadKey}
            file={book.fileUrl}
            options={PDF_OPTIONS}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="m-auto shrink-0"
            loading={
              <div className="text-sm text-zinc-400">กำลังโหลดไฟล์ PDF...</div>
            }
            error={
              <div className="flex flex-col items-center gap-3 text-center text-sm text-red-400">
                <span>โหลดไฟล์ PDF ไม่สำเร็จ</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                  onClick={() => {
                    setNumPages(0);
                    setAspect(null);
                    setReloadKey((k) => k + 1);
                  }}
                >
                  <RotateCw className="mr-1.5 size-3.5" />
                  ลองใหม่
                </Button>
              </div>
            }
          >
            {ready && layout ? (
              // กล่องนอกมีขนาดเท่าหลังซูม → scroll ได้ครบทุกมุม
              <div
                style={{
                  width: layout.bookW * zoom,
                  height: layout.pageH * zoom,
                }}
              >
                <div
                  className="relative"
                  style={{
                    width: layout.bookW,
                    height: layout.pageH,
                    transform: `scale(${zoom})`,
                    transformOrigin: "0 0",
                  }}
                >
                  {/* ชั้นกระจกใส: กันไม่ให้ flipbook จับเมาส์/นิ้วเอง (เราจัดการ gesture ที่ viewport) */}
                  <div className="absolute inset-0 z-30" />

                  <HTMLFlipBook
                    // ขนาดจอ/แนวจอเปลี่ยน → สร้าง flipbook ใหม่ที่หน้าเดิม
                    key={`${layout.pageW}x${layout.pageH}-${portrait ? "p" : "l"}`}
                    width={layout.pageW}
                    height={layout.pageH}
                    size="fixed"
                    minWidth={120}
                    maxWidth={2000}
                    minHeight={160}
                    maxHeight={3000}
                    drawShadow
                    usePortrait={portrait}
                    startPage={Math.max(0, pageNumber - 1)}
                    showCover={false}
                    mobileScrollSupport={false}
                    swipeDistance={0}
                    clickEventForward={false}
                    onFlip={onPageFlip}
                    ref={bookRef}
                    className="mx-auto rounded-sm shadow-2xl"
                  >
                    {pages}
                  </HTMLFlipBook>
                </div>
              </div>
            ) : null}
          </Document>
        </div>

        <Button
          variant="outline"
          size="icon"
          aria-label="หน้าถัดไป"
          className="absolute right-2 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 rounded-full border-zinc-700 bg-zinc-900 text-white shadow-md hover:bg-zinc-800 md:right-8 md:flex"
          onClick={flipNext}
          disabled={atEnd}
        >
          <ChevronRight className="size-5" />
        </Button>
      </main>

      {/* Footer */}
      <footer
        className="z-50 flex h-12 shrink-0 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2 shadow-sm sm:gap-4 sm:px-4"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="หน้าก่อนหน้า"
          className="h-8 w-8 shrink-0 text-white hover:bg-zinc-800 md:hidden"
          onClick={flipPrev}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="hidden w-12 shrink-0 text-right text-xs font-medium tabular-nums text-zinc-300 sm:block">
          {progressPercent}%
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-zinc-300 sm:hidden">
          {shownPage}/{numPages || "?"}
        </span>
        <input
          type="range"
          aria-label="เลื่อนไปหน้า"
          min={1}
          max={numPages || 1}
          value={shownPage}
          onChange={(e) => setSliderDraft(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 cursor-pointer rounded-lg bg-zinc-700 accent-primary"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="หน้าถัดไป"
          className="h-8 w-8 shrink-0 text-white hover:bg-zinc-800 md:hidden"
          onClick={flipNext}
          disabled={atEnd}
        >
          <ChevronRight className="size-4" />
        </Button>
        <ReadingTimer slug={slug} />
      </footer>
    </div>
  );
}
