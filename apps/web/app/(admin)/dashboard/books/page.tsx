import { prisma, type Prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { Badge } from "@repo/ui/components/badge";
import {
  BookOpen,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AddBookModal } from "@/components/add-book-modal";
import { DeleteBookButton } from "@/components/delete-book-button";
import { EditBookModal } from "@/components/edit-book-modal";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { DashboardBooksPagination } from "@/components/dashboard-books-pagination";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  date?: string;
  category?: string;
  page?: string;
  limit?: string;
}>;

// Server Action สำหรับลบหนังสือ
async function deleteBookAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.book.delete({
    where: { id },
  });

  revalidatePath("/dashboard/books");
  revalidatePath("/books");
  revalidatePath("/");
}

export default async function DashboardBooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const date = params.date || "";
  const category = params.category || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  // สร้างเงื่อนไขการค้นหา (Prisma Where Clause)
  const where: Prisma.BookWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category && category !== "ALL") {
    where.categories = {
      some: {
        category: {
          slug: category,
        },
      },
    };
  }

  if (date) {
    const startDate = new Date(date);
    if (!isNaN(startDate.getTime())) {
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }
  }

  const skip = (page - 1) * limit;

  // ดึงข้อมูลแบบแบ่งหน้า (Pagination) และนับจำนวนทั้งหมดพร้อมกัน
  const [books, total, categories] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.book.count({ where }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // สร้าง Query String ปัจจุบันสำหรับส่งต่อใน Pagination
  const createPageURL = (newPage: number, newLimit?: number) => {
    const searchParamsObj = new URLSearchParams();
    if (q) searchParamsObj.set("q", q);
    if (date) searchParamsObj.set("date", date);
    if (category) searchParamsObj.set("category", category);
    searchParamsObj.set("page", newPage.toString());
    searchParamsObj.set("limit", (newLimit || limit).toString());
    return `/dashboard/books?${searchParamsObj.toString()}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-foreground">
      {/* ส่วนหัวหน้าจัดการ และ Modal สำหรับเพิ่มหนังสือ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            จัดการหนังสือในระบบ
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            อัปโหลด จัดการ และกำหนดสถานะหนังสืออิเล็กทรอนิกส์
          </p>
        </div>
        <AddBookModal categories={categories} />
      </div>

      {/* ฟอร์มค้นหาและกรองข้อมูล */}
      <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-6">
        <form
          method="GET"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        >
          <input type="hidden" name="limit" value={limit} />
          {/* ค้นหาด้วยชื่อ หรือ ผู้เขียน */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              ค้นหา (ชื่อหนังสือ / ผู้แต่ง)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="พิมพ์ชื่อหรือผู้แต่ง..."
                className="pl-9 bg-background/50"
              />
            </div>
          </div>

          {/* ค้นหาด้วย Category */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              หมวดหมู่ (Category)
            </label>
            <select
              name="category"
              defaultValue={category || "ALL"}
              className="flex h-10 w-full rounded-md border border-input bg-background/55 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ALL">ทุกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* ค้นหาด้วยวันที่สร้าง */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              วันที่สร้าง
            </label>
            <Input
              type="date"
              name="date"
              defaultValue={date}
              className="bg-background/50"
            />
          </div>

          {/* ปุ่มกดค้นหา / ล้างตัวกรอง */}
          <div className="flex items-center gap-2">
            <Button type="submit" className="flex-1">
              ค้นหา
            </Button>
            {(q || date || (category && category !== "ALL")) && (
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard/books">ล้างตัวกรอง</Link>
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* ตารางแสดงรายการหนังสือ (จัดสัดส่วน Width Column ใหม่) */}
      <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <h3 className="font-semibold text-base">
            รายการหนังสือทั้งหมด ({total} เล่ม)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
                <th className="p-4 pl-6 w-[36%]">ชื่อหนังสือ</th>
                <th className="p-4 w-[24%]">ผู้เขียน</th>
                <th className="p-4 w-[12%] text-center">วันที่สร้าง</th>
                <th className="p-4 w-[10%] text-center">ประเภท</th>
                <th className="p-4 w-[10%] text-center">สถานะ</th>
                <th className="p-4 pr-6 w-[8%] text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {books.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <BookOpen className="size-10 mx-auto mb-2 opacity-40" />
                    ไม่พบหนังสือที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {/* ชื่อหนังสือ (กว้างขึ้นและตัดข้อความเกิน) */}
                    <td className="p-4 pl-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-muted rounded border overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                          {book.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span
                            className="line-clamp-2 text-foreground font-medium text-sm leading-snug"
                            title={book.title}
                          >
                            {book.title}
                          </span>
                          {book.categories && book.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {book.categories.map((c: any) => (
                                <span
                                  key={c.category.id}
                                  className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                >
                                  {c.category.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ผู้เขียน */}
                    <td className="p-4 text-muted-foreground text-xs">
                      <span
                        className="line-clamp-2 leading-relaxed"
                        title={book.author || "-"}
                      >
                        {book.author || "-"}
                      </span>
                    </td>

                    {/* วันที่สร้าง */}
                    <td className="p-4 text-center text-muted-foreground text-xs font-mono whitespace-nowrap">
                      {new Date(book.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* ประเภทไฟล์ */}
                    <td className="p-4 text-center">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono uppercase"
                      >
                        {book.fileType || "PDF"}
                      </Badge>
                    </td>

                    {/* สถานะ */}
                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          book.status === "PUBLISHED" ? "default" : "secondary"
                        }
                        className="text-xs whitespace-nowrap"
                      >
                        {book.status === "PUBLISHED"
                          ? "เผยแพร่แล้ว"
                          : "ฉบับร่าง"}
                      </Badge>
                    </td>

                    {/* จัดการ */}
                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <EditBookModal book={book} categories={categories} />

                        <form action={deleteBookAction}>
                          <input type="hidden" name="id" value={book.id} />
                          <DeleteBookButton />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar ด้านล่างตาราง */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-border/60 bg-muted/10">
          <div className="text-xs text-muted-foreground font-medium">
            {startItem}-{endItem} จาก {total} เล่ม
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
            >
              <Link href={createPageURL(page - 1)}>
                <ChevronLeft className="size-4" />
              </Link>
            </Button>

            <span className="text-xs font-semibold px-2">
              หน้า {page} จาก {totalPages || 1}
            </span>

            <Button
              asChild
              variant="outline"
              size="icon"
              className={`h-8 w-8 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
            >
              <Link href={createPageURL(page + 1)}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>

            <DashboardBooksPagination
              currentLimit={limit}
              currentPage={page}
              totalPages={totalPages}
              q={q}
              date={date}
              category={category}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
