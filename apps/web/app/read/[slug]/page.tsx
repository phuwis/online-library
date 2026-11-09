"use client";

import { use, useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import dynamic from "next/dynamic";

const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false },
);
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
});
const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false,
}) as any;

export default function BookReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);

  const [pageNumber, setPageNumber] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const savedPage = localStorage.getItem(`book_page_${slug}`);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const [zoom, setZoom] = useState<number>(100);
  const bookRef = useRef<any>(null);
  const [hasInitializedPage, setHasInitializedPage] = useState(false);

  // State สำหรับ Dropdown เมนู
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // State บุ๊กมาร์กภาพรวมทั้งเล่มเก็บลง localStorage (bookmarked_slugs)
  const [isBookmarked, setIsBookmarked] = useState(false);

  // State จับเวลาอ่านจริง
  const [readingSeconds, setReadingSeconds] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const savedTime = localStorage.getItem(`book_time_${slug}`);
    return savedTime ? parseInt(savedTime, 10) : 0;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // โหลดสถานะบุ๊กมาร์กภาพรวมเล่มจาก localStorage
  useEffect(() => {
    const savedGlobalBookmarks = localStorage.getItem("bookmarked_slugs");
    if (savedGlobalBookmarks) {
      try {
        const slugs: string[] = JSON.parse(savedGlobalBookmarks);
        setIsBookmarked(slugs.includes(slug));
      } catch (e) {
        console.error(e);
      }
    }
  }, [slug]);

  // ปิดเมนูเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
    });
  }, []);

  useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const preventGesture = (e: Event) => e.preventDefault();

    window.addEventListener("wheel", preventBrowserZoom, { passive: false });
    window.addEventListener("gesturestart", preventGesture);
    window.addEventListener("gesturechange", preventGesture);

    return () => {
      window.removeEventListener("wheel", preventBrowserZoom);
      window.removeEventListener("gesturestart", preventGesture);
      window.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  useEffect(() => {
    async function fetchBookData() {
      try {
        const res = await fetch(`/api/books/${slug}`);
        const data = await res.json();
        if (data.success) {
          setBook(data.book);
        }
      } catch (error) {
        console.error("Failed to fetch book:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookData();
  }, [slug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setReadingSeconds((prev) => {
        const nextTime = prev + 1;
        localStorage.setItem(`book_time_${slug}`, nextTime.toString());
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [slug]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    if (numPages > 0 && bookRef.current && !hasInitializedPage) {
      const savedPage = localStorage.getItem(`book_page_${slug}`);
      const targetPage = savedPage ? parseInt(savedPage, 10) : pageNumber;

      if (targetPage >= 1 && targetPage <= numPages) {
        setTimeout(() => {
          bookRef.current.pageFlip().turnToPage(targetPage - 1);
        }, 150);
      }
      setHasInitializedPage(true);
    }
  }, [numPages, slug, hasInitializedPage, pageNumber]);

  const handlePrevPage = () => {
    if (bookRef.current) bookRef.current.pageFlip().flipPrev();
  };

  const handleNextPage = () => {
    if (bookRef.current) bookRef.current.pageFlip().flipNext();
  };

  const onPageFlip = (e: any) => {
    const newPage = e.data + 1;
    setPageNumber(newPage);
    localStorage.setItem(`book_page_${slug}`, newPage.toString());
  };

  // ฟังก์ชันเปิด/ปิด บุ๊กมาร์กทั้งเล่มจากเมนู 3 จุด
  const toggleGlobalBookmark = () => {
    const saved = localStorage.getItem("bookmarked_slugs");
    let slugs: string[] = saved ? JSON.parse(saved) : [];

    if (slugs.includes(slug)) {
      slugs = slugs.filter((s) => s !== slug);
      setIsBookmarked(false);
    } else {
      slugs.push(slug);
      setIsBookmarked(true);
    }

    localStorage.setItem("bookmarked_slugs", JSON.stringify(slugs));
    setShowMenu(false);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY < 0 ? 10 : -10;
        const nextZoom = prev + delta;
        return Math.min(200, Math.max(100, nextZoom));
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 100) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (viewportRef.current) {
      setScrollPos({
        left: viewportRef.current.scrollLeft,
        top: viewportRef.current.scrollTop,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 100) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = scrollPos.left - dx;
      viewportRef.current.scrollTop = scrollPos.top - dy;
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    numPages > 0 ? Math.round((pageNumber / numPages) * 100) : 0;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950 text-white flex items-center justify-center">
        กำลังโหลดข้อมูลหนังสือ...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950 text-white flex items-center justify-center">
        ไม่พบข้อมูลหนังสือ
      </div>
    );
  }

  const currentScale = zoom / 100;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-zinc-950 text-foreground flex flex-col justify-between p-2 md:p-4 overflow-hidden select-none"
      style={{ touchAction: "none" }}
    >
      {/* Header */}
      <header className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3 max-w-[50%]">
          <Link href={`/books/${slug}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="ย้อนกลับ"
              className="text-white hover:bg-zinc-800 shrink-0"
            >
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="font-semibold text-xs md:text-sm text-gray-100 leading-snug break-words line-clamp-2">
              {book.title}
            </h1>
            <p className="text-[11px] text-zinc-400 truncate">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <span className="text-xs md:text-sm text-zinc-300">
            หน้า {pageNumber} / {numPages || "?"}
          </span>
          <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none text-white hover:bg-zinc-700 disabled:opacity-40"
              onClick={() => setZoom((prev) => Math.max(100, prev - 20))}
              disabled={zoom <= 100}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-xs px-2 text-zinc-300">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none text-white hover:bg-zinc-700 disabled:opacity-40"
              onClick={() => setZoom((prev) => Math.min(200, prev + 20))}
              disabled={zoom >= 200}
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>

          {/* เมนูสามจุด (บุ๊กมาร์กเล่ม + ปุ่ม Download ที่ Disable ไว้) */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-zinc-800"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <MoreVertical className="size-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                {/* บุ๊กมาร์กหนังสือเล่มนี้ */}
                <button
                  onClick={toggleGlobalBookmark}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-zinc-200 hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <Bookmark
                      className={`size-4 ${isBookmarked ? "text-yellow-500 fill-yellow-500" : ""}`}
                    />
                    <span>
                      {isBookmarked
                        ? "เอาบุ๊กมาร์กหนังสือออก"
                        : "บุ๊กมาร์กหนังสือเล่มนี้"}
                    </span>
                  </div>
                  {isBookmarked && (
                    <Check className="size-3.5 text-yellow-500" />
                  )}
                </button>

                {/* ปุ่ม Download (Disable ไว้ตามต้องการ) */}
                <button
                  disabled
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-zinc-500 cursor-not-allowed border-t border-zinc-800"
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
      <main className="flex-1 flex items-center justify-center relative my-1 w-full overflow-hidden">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 md:left-8 z-40 rounded-full h-10 w-10 shadow-md bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
          onClick={handlePrevPage}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div
          ref={viewportRef}
          onWheel={handleWheelZoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full flex items-center justify-center select-none ${zoom > 100 ? "overflow-auto cursor-grab active:cursor-grabbing" : "overflow-hidden"}`}
        >
          <div
            className="flex items-center justify-center transition-transform duration-100 ease-out m-auto"
            style={{
              transform: `scale(${currentScale})`,
              transformOrigin: "center center",
              width: `${800 * currentScale}px`,
              height: `${560 * currentScale}px`,
              minWidth: "100%",
              minHeight: "100%",
            }}
          >
            <Document
              file={book.fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="text-sm text-zinc-400">
                  กำลังโหลดไฟล์ PDF...
                </div>
              }
              error={
                <div className="text-sm text-red-400">
                  โหลดไฟล์ PDF ไม่สำเร็จ
                </div>
              }
            >
              {numPages > 0 && (
                <HTMLFlipBook
                  width={400}
                  height={560}
                  size="fixed"
                  minWidth={300}
                  maxWidth={600}
                  minHeight={400}
                  maxHeight={800}
                  drawShadow={true}
                  usePortrait={false}
                  startPage={pageNumber > 0 ? pageNumber - 1 : 0}
                  showCover={false}
                  mobileScrollSupport={true}
                  onFlip={onPageFlip}
                  ref={bookRef}
                  className="shadow-2xl rounded-sm mx-auto"
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div
                      key={`page_${index + 1}`}
                      className="bg-white shadow-md relative overflow-hidden"
                      style={{ width: "400px", height: "560px" }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <Page
                          pageNumber={index + 1}
                          width={400}
                          scale={2.0}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </div>
                    </div>
                  ))}
                </HTMLFlipBook>
              )}
            </Document>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 md:right-8 z-40 rounded-full h-10 w-10 shadow-md bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
          onClick={handleNextPage}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight className="size-5" />
        </Button>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 shadow-sm flex items-center gap-4 shrink-0 h-12 z-50">
        <span className="text-xs font-medium text-zinc-300 w-12 text-right">
          {progressPercent}%
        </span>
        <input
          type="range"
          min={1}
          max={numPages || 1}
          value={pageNumber}
          onChange={(e) => {
            const page = Number(e.target.value);
            setPageNumber(page);
            localStorage.setItem(`book_page_${slug}`, page.toString());
            if (bookRef.current)
              bookRef.current.pageFlip().turnToPage(page - 1);
          }}
          className="flex-1 accent-primary cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
        />
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 w-20">
          <Clock className="size-3.5" />
          <span>{formatTime(readingSeconds)}</span>
        </div>
      </footer>
    </div>
  );
}
