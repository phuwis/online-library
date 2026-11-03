import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { Badge } from "@repo/ui/components/badge";
import { BookOpen, FileText } from "lucide-react";
import { AddBookModal } from "@/components/add-book-modal";
import { DeleteBookButton } from "@/components/delete-book-button";
import { EditBookModal } from "@/components/edit-book-modal";

export const dynamic = "force-dynamic";

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

export default async function DashboardBooksPage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto text-foreground">
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
        <AddBookModal />
      </div>

      {/* ตารางแสดงรายการหนังสือ */}
      <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-semibold text-base">
            รายการหนังสือทั้งหมด ({books.length} เล่ม)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
                <th className="p-4 pl-6">ชื่อหนังสือ</th>
                <th className="p-4">ผู้เขียน</th>
                <th className="p-4">ประเภทไฟล์</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 pr-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {books.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <BookOpen className="size-10 mx-auto mb-2 opacity-40" />
                    ยังไม่มีหนังสือในระบบ คลิกปุ่ม &quot;เพิ่มหนังสือใหม่&quot;
                    ด้านบน
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 pl-6 font-medium flex items-center gap-3">
                      <div className="w-9 h-12 bg-muted rounded border overflow-hidden shrink-0 flex items-center justify-center">
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
                      <span className="line-clamp-2">{book.title}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">{book.author}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {book.fileType}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          book.status === "PUBLISHED" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {book.status === "PUBLISHED"
                          ? "เผยแพร่แล้ว"
                          : "ฉบับร่าง"}
                      </Badge>
                    </td>

                    {/* จัดระเบียบการแสดงผลปุ่มจัดการใน TD ให้สะอาดและถูกต้องตามหลัก HTML */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EditBookModal book={book} />

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
      </div>
    </div>
  );
}
