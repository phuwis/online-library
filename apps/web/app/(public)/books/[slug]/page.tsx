import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  ArrowLeft,
  Library,
  Barcode,
  Building2,
  Calendar,
  FileText,
  MapPin,
  Bookmark,
} from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { getPublishedBook } from "@/features/books/queries";
import { BookBookmarkButton } from "@/components/book-bookmark-button";

export const dynamic = "force-dynamic";

const DDC_OPTIONS = [
  { value: "GENERAL_000", label: "000 - เบ็ดเตล็ด / ความรู้ทั่วไป" },
  { value: "PHILOSOPHY_100", label: "100 - ปรัชญาและจิตวิทยา" },
  { value: "RELIGION_200", label: "200 - ศาสนา" },
  { value: "SOCIAL_SCIENCES_300", label: "300 - สังคมศาสตร์" },
  { value: "LANGUAGE_400", label: "400 - ภาษาศาสตร์" },
  { value: "SCIENCE_500", label: "500 - วิทยาศาสตร์และคณิตศาสตร์" },
  { value: "TECHNOLOGY_600", label: "600 - เทคโนโลยี / วิทยาศาสตร์ประยุกต์" },
  { value: "ARTS_RECREATION_700", label: "700 - ศิลปะและการบันเทิง / กีฬา" },
  { value: "LITERATURE_800", label: "800 - วรรณกรรม / วรรณคดี" },
  { value: "HISTORY_GEOGRAPHY_900", label: "900 - ภูมิศาสตร์และประวัติศาสตร์" },
];

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getPublishedBook(slug);
  if (!book) notFound();

  const getDdcLabel = (ddcValue?: string | null) => {
    if (!ddcValue) return "-";
    const found = DDC_OPTIONS.find((item) => item.value === ddcValue);
    return found ? found.label : ddcValue.replace(/_/g, " ");
  };

  return (
    /* 🌟 เพิ่ม pb-48 บนมือถือ เพื่อดันพื้นที่ให้พ้น Layout Footer ที่ซ้อนทับอยู่ด้านล่างสุด */
    <div className="space-y-6 pb-48 md:pb-12">
      {/* ส่วนหัวและการนำทาง */}
      <div className="bg-card/90 dark:bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-xl shrink-0 size-9 sm:size-10"
            >
              <Link href="/books" aria-label="กลับไปหน้าหนังสือทั้งหมด">
                <ArrowLeft className="size-4 sm:size-5" />
              </Link>
            </Button>

            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Library className="size-5 sm:size-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                รายละเอียดหนังสือ
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                ข้อมูลและรายละเอียดเชิงลึกของหนังสือเล่มนี้
              </p>
            </div>
          </div>
        </div>

        {/* รายละเอียดเนื้อหาหนังสือภายใน Card หลัก */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-[280px_1fr] items-start pt-4 border-t border-border/60">
          {/* ฝั่งซ้าย: รูปปกหนังสือแบบ Sticky (สำหรับ Desktop) */}
          <div className="md:sticky md:top-24 space-y-4">
            <div className="relative aspect-[3/4] w-full max-w-[220px] sm:max-w-[260px] md:max-w-none mx-auto overflow-hidden rounded-xl border bg-muted shadow-md">
              <BookBookmarkButton slug={book.slug} />

              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt={`ปก ${book.title}`}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-secondary/50">
                  <BookOpen className="size-12 text-muted-foreground/60" />
                </div>
              )}
            </div>

            {/* ปุ่มเริ่มอ่านฝั่ง Desktop */}
            <div className="hidden md:block">
              <Button
                asChild
                size="lg"
                className="w-full shadow-md rounded-xl text-sm sm:text-base"
              >
                <Link href={`/read/${book.slug}`}>
                  <BookOpen className="size-4 mr-2" /> เริ่มอ่านหนังสือ
                </Link>
              </Button>
            </div>
          </div>

          {/* ฝั่งขวา: ข้อมูลรายละเอียด */}
          <div className="space-y-4 sm:space-y-6 text-center md:text-left">
            {/* ปุ่มเริ่มอ่านด่วนบนมือถือ */}
            <div className="block md:hidden pt-1">
              <Button
                asChild
                size="lg"
                className="w-full shadow-lg rounded-xl text-sm font-semibold bg-primary text-primary-foreground py-6"
              >
                <Link href={`/read/${book.slug}`}>
                  <BookOpen className="size-5 mr-2" /> เริ่มอ่านหนังสือทันที
                </Link>
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
                {book.title}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
                โดย {book.author || "ไม่ระบุผู้แต่ง"}
              </p>
            </div>

            {/* หมวดหมู่ */}
            {book.categories && book.categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center md:justify-start">
                {book.categories.map((bc) => (
                  <Link
                    key={bc.categoryId}
                    href={`/books?category=${bc.category.slug}`}
                  >
                    <Badge
                      variant="outline"
                      className="px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      {bc.category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">
                ไม่มีหมวดหมู่
              </p>
            )}

            {/* ข้อมูลบรรณานุกรมเพิ่มเติม */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pb-2 text-left bg-muted/30 p-3.5 rounded-xl border border-border/40 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Barcode className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">
                  รหัสหนังสือ:
                </span>
                <span className="font-semibold text-foreground">
                  {book.bookCode || "-"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Bookmark className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">
                  หมวดหมู่ DDC:
                </span>
                <span className="font-semibold text-foreground">
                  {getDdcLabel(book.ddc)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">
                  สำนักพิมพ์:
                </span>
                <span className="font-semibold text-foreground">
                  {book.publisher || "-"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">
                  ปีที่พิมพ์ / ข้อมูลพิมพ์:
                </span>
                <span className="font-semibold text-foreground">
                  {book.publicationInfo || "-"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">
                  จำนวนหน้า:
                </span>
                <span className="font-semibold text-foreground">
                  {book.pageCount ? `${book.pageCount} หน้า` : "-"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">
                  จังหวัดที่พิมพ์:
                </span>
                <span className="font-semibold text-foreground">
                  {book.publishingProvince || "-"}
                </span>
              </div>
            </div>

            {/* คำอธิบาย */}
            {book.description ? (
              <div className="space-y-2 text-left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  รายละเอียดและเนื้อหาย่อ
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed bg-card/40 p-4 sm:p-5 rounded-xl border border-border/50 shadow-sm">
                  <ReactMarkdown>{book.description}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground/60 italic text-left">
                ไม่มีคำอธิบายเพิ่มเติม
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar สำหรับมือถือ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border p-3 flex items-center justify-between gap-3 md:hidden shadow-2xl">
        <div className="truncate px-2">
          <p className="text-xs font-bold text-foreground truncate">
            {book.title}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {book.author || "ไม่ระบุผู้แต่ง"}
          </p>
        </div>
        <Button
          asChild
          size="default"
          className="shrink-0 shadow-md rounded-xl text-xs font-semibold px-5"
        >
          <Link href={`/read/${book.slug}`}>
            <BookOpen className="size-4 mr-1.5" /> เริ่มอ่าน
          </Link>
        </Button>
      </div>
    </div>
  );
}
