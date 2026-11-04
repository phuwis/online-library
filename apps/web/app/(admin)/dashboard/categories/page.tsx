"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Trash2, Plus, FolderTree, Loader2 } from "lucide-react";
import { ResetCategoryBooksModal } from "@/components/reset-category-book-modal";

interface Book {
  id: string;
  title: string;
}

interface BookCategoryRelation {
  book: Book;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    books: number;
  };
  books?: BookCategoryRelation[]; // 🌟 เพิ่มบรรทัดนี้รองรับรายชื่อหนังสือ
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ฟังก์ชันดึงข้อมูลหมวดหมู่ผ่าน API GET /api/categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ฟังก์ชันเพิ่มหมวดหมู่ผ่าน API POST /api/categories
  async function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const slug = formData.get("slug");

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();

      if (data.success) {
        (e.target as HTMLFormElement).reset();
        fetchCategories(); // โหลดข้อมูลใหม่
        router.refresh();
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการสร้างหมวดหมู่");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  }

  // ฟังก์ชันลบหมวดหมู่ผ่าน API DELETE /api/categories/[id]
  async function handleDeleteCategory(id: string) {
    if (!confirm("คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        fetchCategories(); // โหลดข้อมูลใหม่
        router.refresh();
      } else {
        alert(data.error || "ไม่สามารถลบได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  }

  return (
    <div
      className="space-y-8"
      style={{ fontFamily: '"PrimaryFont", sans-serif' }}
    >
      {/* Header Title */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary">
          <FolderTree className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            จัดการหมวดหมู่หนังสือ
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          เพิ่ม จัดการ
          และควบคุมหมวดหมู่สำหรับจำแนกประเภทหนังสือภายในระบบห้องสมุด
        </p>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Form Card เพิ่มหมวดหมู่ */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4 text-foreground flex items-center gap-2">
          <Plus className="size-4 text-primary" /> เพิ่มหมวดหมู่ใหม่
        </h2>
        <form
          onSubmit={handleAddCategory}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="w-full space-y-1">
            <Input
              name="name"
              placeholder="ชื่อหมวดหมู่ (เช่น นิยาย, ประวัติศาสตร์)..."
              required
              className="bg-background/50 h-11"
            />
          </div>
          <div className="w-full space-y-1">
            <Input
              name="slug"
              placeholder="Slug (เช่น fiction - ไม่ใส่ระบบสร้างให้)"
              className="bg-background/50 h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto h-11 px-6 gap-2 shrink-0 font-medium"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            <Plus className="size-4" /> บันทึกหมวดหมู่
          </Button>
        </form>
      </div>

      {/* Table Section ตารางแสดงรายการหมวดหมู่ */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">
            รายการหมวดหมู่ทั้งหมด ({categories.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-xs font-semibold text-muted-foreground bg-muted/30">
                <th className="px-6 py-3.5">ชื่อหมวดหมู่</th>
                <th className="px-6 py-3.5">Slug (URL Path)</th>
                <th className="px-6 py-3.5 text-center">จำนวนหนังสือ</th>
                <th className="px-6 py-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Loader2 className="size-5 animate-spin mx-auto mb-2" />{" "}
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-muted-foreground"
                  >
                    ยังไม่มีข้อมูลหมวดหมู่ในระบบ
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const hasBooks = cat._count.books > 0;
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-muted/15 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {cat.slug}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            hasBooks
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {cat._count.books} เล่ม
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 🌟 ปุ่มรีเซ็ต / เคลียร์หมวดหมู่ออกจากหนังสือทุกเล่ม */}
                          <ResetCategoryBooksModal category={cat} />

                          {hasBooks ? (
                            <span title="ไม่สามารถลบได้เนื่องจากยังมีหนังสือในหมวดหมู่นี้">
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="text-muted-foreground/40 cursor-not-allowed"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
