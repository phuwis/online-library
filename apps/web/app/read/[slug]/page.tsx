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
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const bookRef = useRef<any>(null);

  // 🌟 สร้าง Session ID เฉพาะกิจสำหรับการเปิดอ่านครั้งนี้
  const [sessionId] = useState(() =>
    typeof window !== "undefined" ? crypto.randomUUID() : "",
  );

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
    });
  }, []);

  useEffect(() => {
    async function fetchBookData() {
      try {
        const res = await fetch(`/api/books/${slug}`);
        const data = await res.json();
        if (data.success) {
          setBook(data.book);

          // 🌟 เมื่อโหลดข้อมูลหนังสือสำเร็จ ให้ส่ง Event "OPEN" ไปยัง API สถิติ
          if (data.book?.id) {
            fetch("/api/reader/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookId: data.book.id,
                type: "OPEN",
                sessionId,
                percent: 0,
                deltaSec: 0,
              }),
            }).catch((err) => console.error("Failed to track open book:", err));
          }
        }
      } catch (error) {
        console.error("Failed to fetch book:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookData();
  }, [slug, sessionId]);

  // 🌟 ตั้งเวลาส่ง Heartbeat สะสมเวลาอ่านทุกๆ 30 วินาที
  useEffect(() => {
    if (!book?.id) return;

    const interval = setInterval(() => {
      const currentPercent =
        numPages > 0 ? Math.round((pageNumber / numPages) * 100) : 0;
      fetch("/api/reader/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          type: "HEARTBEAT",
          sessionId,
          percent: currentPercent,
          deltaSec: 30, // สะสมเวลาเพิ่ม 30 วินาทีต่อรอบ
        }),
      }).catch((err) => console.error("Failed to send heartbeat:", err));
    }, 30000);

    return () => clearInterval(interval);
  }, [book?.id, pageNumber, numPages, sessionId]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePrevPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  const handleNextPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const onPageFlip = (e: any) => {
    const newPage = e.data + 1;
    setPageNumber(newPage);

    // ถ้าเปิดอ่านถึงหน้าสุดท้าย สามารถส่ง Event "FINISH" ได้
    if (book?.id && numPages > 0 && newPage >= numPages) {
      fetch("/api/reader/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          type: "FINISH",
          sessionId,
          percent: 100,
          deltaSec: 0,
        }),
      }).catch((err) => console.error("Failed to track finish book:", err));
    }
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

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 text-foreground flex flex-col justify-between p-2 md:p-4 overflow-hidden select-none">
      {/* 1. Reader Header */}
      <header className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 shadow-sm flex items-center justify-between shrink-0 h-14">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              aria-label="ย้อนกลับ"
              className="text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-xs md:text-sm text-gray-100 truncate max-w-xs md:max-w-md">
              {book.title}
            </h1>
            <p className="text-[11px] text-zinc-400">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-xs md:text-sm text-zinc-300">
            หน้า {pageNumber} / {numPages || "?"}
          </span>
          <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none text-white hover:bg-zinc-700"
              onClick={() => setZoom(Math.max(60, zoom - 10))}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-xs px-2 text-zinc-300">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none text-white hover:bg-zinc-700"
              onClick={() => setZoom(Math.min(130, zoom + 10))}
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex text-white hover:bg-zinc-800"
          >
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </header>

      {/* 2. Main Reader Content Area */}
      <main className="flex-1 flex items-center justify-center relative my-1 overflow-hidden w-full">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 md:left-8 z-30 rounded-full h-10 w-10 shadow-md bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
          onClick={handlePrevPage}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div
          className="flex items-center justify-center w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <Document
            file={book.fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="text-sm text-zinc-400">กำลังเปิดหนังสือ...</div>
            }
            error={
              <div className="text-sm text-red-400">
                ไม่สามารถโหลดไฟล์ PDF ได้
              </div>
            }
          >
            {numPages > 0 && (
              <HTMLFlipBook
                width={380}
                height={540}
                size="fixed"
                minWidth={300}
                maxWidth={450}
                minHeight={400}
                maxHeight={600}
                drawShadow={true}
                usePortrait={false}
                startPage={0}
                showCover={false}
                mobileScrollSupport={true}
                onFlip={onPageFlip}
                ref={bookRef}
                className="shadow-2xl rounded-sm mx-auto"
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    className="bg-white flex items-center justify-center overflow-hidden shadow-md"
                  >
                    <Page
                      pageNumber={index + 1}
                      width={380}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))}
              </HTMLFlipBook>
            )}
          </Document>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 md:right-8 z-30 rounded-full h-10 w-10 shadow-md bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
          onClick={handleNextPage}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight className="size-5" />
        </Button>
      </main>

      {/* 3. Reader Footer */}
      <footer className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 shadow-sm flex items-center gap-4 shrink-0 h-12">
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
            if (bookRef.current) {
              bookRef.current.pageFlip().turnToPage(page - 1);
            }
          }}
          className="flex-1 accent-primary cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
        />
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 w-20">
          <Clock className="size-3.5" />
          <span>03:50</span>
        </div>
      </footer>
    </div>
  );
}
