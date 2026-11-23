import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Barcode,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  FileText,
  Hash,
  Layers,
  MapPin,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { getPublishedBook, listRelatedBooks } from "@/features/books/queries";
import {
  ddcInfo,
  toSearchParams,
  parseBookFilters,
} from "@/features/books/filters";
import { BookBookmarkButton } from "@/components/book-bookmark-button";
import { BookshelfStrip } from "@/components/bookshelf-strip";
import {
  CopyButton,
  MobileReadBar,
  ReadButton,
  ReadProgress,
  RelatedBooks,
  ShareButton,
} from "@/components/books/book-detail-actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

/** ลิงก์ไปหน้าหนังสือทั้งหมดพร้อมตัวกรอง เช่น filterHref({ publisher: ["..."] }) */
function filterHref(patch: Partial<ReturnType<typeof parseBookFilters>>) {
  const qs = toSearchParams({ ...parseBookFilters({}), ...patch }).toString();
  return `/books${qs ? `?${qs}` : ""}`;
}

/** ตัดสัญลักษณ์ Markdown ออก ใช้เป็นคำอธิบายสั้นใน meta */
function plainText(md: string, max = 160) {
  const text = md
    .replace(/[#>*_`~\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "long",
  timeZone: "Asia/Bangkok",
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublishedBook(slug);
  if (!book) return { title: "ไม่พบหนังสือ | ห้องสมุดกระทรวงมหาดไทย" };
  const description = book.description
    ? plainText(book.description)
    : `${book.title} โดย ${book.author} — อ่านออนไลน์ที่ห้องสมุดกระทรวงมหาดไทย`;
  return {
    title: `${book.title} | ห้องสมุดกระทรวงมหาดไทย`,
    description,
    openGraph: {
      title: book.title,
      description,
      type: "book",
      ...(book.coverUrl
        ? { images: [{ url: book.coverUrl, alt: book.title }] }
        : {}),
    },
  };
}

export default async function BookPage({ params }: { params: Params }) {
  const { slug } = await params;
  const book = await getPublishedBook(slug);
  if (!book) notFound();

  const related = await listRelatedBooks(book);
  const ddc = ddcInfo(book.ddc);
  const firstCategory = book.categories[0]?.category;

  /** ข้อมูลบรรณานุกรม: ค่าที่กดได้จะพาไปหน้ารวมพร้อมตัวกรอง */
  const facts: {
    icon: typeof Barcode;
    label: string;
    value: string | null;
    href?: string;
    copy?: boolean;
  }[] = [
    { icon: Barcode, label: "รหัสหนังสือ", value: book.bookCode, copy: true },
    {
      icon: Hash,
      label: "หมวดหมู่ DDC",
      value: ddc ? `${ddc.code} ${ddc.label}` : null,
      href: ddc ? filterHref({ ddc: [ddc.value] }) : undefined,
    },
    {
      icon: Building2,
      label: "สำนักพิมพ์",
      value: book.publisher,
      href: book.publisher
        ? filterHref({ publisher: [book.publisher] })
        : undefined,
    },
    {
      icon: ScrollText,
      label: "ปีที่พิมพ์ / ข้อมูลการพิมพ์",
      value: book.publicationInfo,
    },
    {
      icon: FileText,
      label: "จำนวนหน้า",
      value: book.pageCount ? `${book.pageCount} หน้า` : null,
    },
    {
      icon: MapPin,
      label: "จังหวัดที่จัดพิมพ์",
      value: book.publishingProvince,
      href: book.publishingProvince
        ? filterHref({ province: [book.publishingProvince] })
        : undefined,
    },
    {
      icon: Layers,
      label: "ประเภทไฟล์",
      value: book.fileType,
      href: filterHref({ type: book.fileType }),
    },
    {
      icon: CalendarDays,
      label: "เผยแพร่ในคลังเมื่อ",
      value: book.publishedAt ? thaiDate.format(book.publishedAt) : null,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 pb-28 pt-6 sm:px-6 sm:pt-8 md:px-8 md:pb-20">
      {/* เส้นทาง */}
      <nav
        aria-label="เส้นทาง"
        className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/" className="shrink-0 hover:text-foreground">
          หน้าแรก
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link href="/books" className="shrink-0 hover:text-foreground">
          หนังสือทั้งหมด
        </Link>
        {firstCategory && (
          <>
            <ChevronRight className="size-3.5 shrink-0" />
            <Link
              href={filterHref({ category: firstCategory.slug })}
              className="shrink-0 hover:text-foreground"
            >
              {firstCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5 shrink-0" />
        <span
          className="truncate font-medium text-foreground"
          aria-current="page"
        >
          {book.title}
        </span>
      </nav>

      {/* ───────── ส่วนหัว: ปก + ข้อมูลหลัก + ปุ่ม ───────── */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-[#2a0f45] to-indigo-950 text-white shadow-xl">
        {/* พื้นหลัง: ปกหนังสือเบลอ */}
        {book.coverUrl && (
          <div aria-hidden className="absolute inset-0 -z-10 opacity-25">
            <Image
              src={book.coverUrl}
              alt=""
              fill
              sizes="10vw"
              className="scale-125 object-cover blur-3xl"
            />
          </div>
        )}
        <div
          aria-hidden
          className="absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-purple-500/25 blur-3xl"
        />
        <BookshelfStrip
          seed={7}
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-12 w-full opacity-25"
        />

        <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10 md:p-10">
          {/* ปก */}
          <div className="relative mx-auto w-44 sm:w-52 md:w-full">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-purple-950 shadow-[0_25px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/20">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={`ปก ${book.title}`}
                  fill
                  priority
                  sizes="(min-width: 768px) 240px, 208px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-800 to-indigo-950 p-5 text-center text-purple-100/70">
                  <BookOpen className="size-10" />
                  <span className="line-clamp-4 text-xs">{book.title}</span>
                </div>
              )}
              <span className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                {book.fileType}
              </span>
            </div>
            <BookBookmarkButton slug={book.slug} title={book.title} />
          </div>

          {/* ข้อมูลหลัก */}
          <div className="flex min-w-0 flex-col justify-center gap-5 text-center md:text-left">
            <div className="flex flex-wrap justify-center gap-1.5 md:justify-start">
              {ddc && (
                <Link
                  href={filterHref({ ddc: [ddc.value] })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-400/25"
                >
                  <span className="font-mono font-bold">{ddc.code}</span>
                  {ddc.label}
                </Link>
              )}
              {book.categories.map((bc) => (
                <Link
                  key={bc.categoryId}
                  href={filterHref({ category: bc.category.slug })}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-purple-50 hover:bg-white/20"
                >
                  {bc.category.name}
                </Link>
              ))}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl md:text-4xl">
                {book.title}
              </h1>
              <p className="text-sm text-purple-100/85 sm:text-base">
                โดย{" "}
                <span className="font-semibold text-white">
                  {book.author || "ไม่ระบุผู้แต่ง"}
                </span>
                {book.publisher && (
                  <>
                    {" • "}
                    <Link
                      href={filterHref({ publisher: [book.publisher] })}
                      className="underline-offset-2 hover:underline"
                    >
                      {book.publisher}
                    </Link>
                  </>
                )}
              </p>
            </div>

            {/* สรุปสั้น */}
            <dl className="flex flex-wrap justify-center gap-2 text-xs md:justify-start">
              {[
                {
                  label: "จำนวนหน้า",
                  value: book.pageCount ? `${book.pageCount} หน้า` : null,
                },
                { label: "ประเภทไฟล์", value: book.fileType },
                {
                  label: "เผยแพร่",
                  value: book.publishedAt
                    ? thaiDate.format(book.publishedAt)
                    : null,
                },
              ]
                .filter((f) => f.value)
                .map((f) => (
                  <div
                    key={f.label}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm"
                  >
                    <dt className="text-[10px] text-purple-200/70">
                      {f.label}
                    </dt>
                    <dd className="font-semibold">{f.value}</dd>
                  </div>
                ))}
            </dl>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <ReadButton slug={book.slug} />
                <BookBookmarkButton
                  slug={book.slug}
                  title={book.title}
                  variant="button"
                />
                <ShareButton title={book.title} />
              </div>
              <ReadProgress slug={book.slug} />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── เรื่องย่อ + ข้อมูลบรรณานุกรม ───────── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Sparkles className="size-4" />
            </span>
            รายละเอียดและเนื้อหาย่อ
          </h2>
          {book.description ? (
            // จัดรูปแบบ Markdown เอง (โปรเจคไม่ได้ติดตั้ง @tailwindcss/typography)
            <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:pt-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-bold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6">
              <ReactMarkdown>{book.description}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              ยังไม่มีคำอธิบายสำหรับหนังสือเล่มนี้
            </p>
          )}
        </article>

        <aside className="h-fit rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <h2 className="mb-3 text-sm font-extrabold text-foreground">
            ข้อมูลบรรณานุกรม
          </h2>
          <dl className="divide-y divide-border/60">
            {facts.map(({ icon: Icon, label, value, href, copy }) => (
              <div key={label} className="flex items-start gap-3 py-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] text-muted-foreground">{label}</dt>
                  <dd className="break-words text-sm font-semibold text-foreground">
                    {!value ? (
                      <span className="font-normal text-muted-foreground/70">
                        -
                      </span>
                    ) : href ? (
                      <Link
                        href={href}
                        className="hover:text-primary hover:underline"
                        title={`ดูหนังสือที่มี${label}นี้`}
                      >
                        {value}
                      </Link>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
                {copy && value && (
                  <CopyButton value={value} label={`คัดลอก${label}`} />
                )}
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {/* ───────── หนังสือที่เกี่ยวข้อง ───────── */}
      {related.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                หนังสือที่เกี่ยวข้อง
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {ddc
                  ? `จากหมวดหมู่และหมวด DDC ${ddc.code} เดียวกัน`
                  : "จากหมวดหมู่เดียวกัน"}
              </p>
            </div>
            <Link
              href={
                firstCategory
                  ? filterHref({ category: firstCategory.slug })
                  : ddc
                    ? filterHref({ ddc: [ddc.value] })
                    : "/books"
              }
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              ดูทั้งหมด <ChevronRight className="size-4" />
            </Link>
          </div>
          <RelatedBooks books={related} />
        </section>
      )}

      <MobileReadBar
        slug={book.slug}
        title={book.title}
        author={book.author || "ไม่ระบุผู้แต่ง"}
      />
    </div>
  );
}
