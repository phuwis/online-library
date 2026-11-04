"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Pencil, X, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  slug: string;
  fileType: string;
  status: string;
  categories?: any[]; // รองรับข้อมูลความสัมพันธ์หมวดหมู่
}

export function EditBookModal({
  book,
  categories,
}: {
  book: Book;
  categories: Category[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ดึงค่าหมวดหมู่เดิมของหนังสือมาเป็นค่าเริ่มต้นใน State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    () => {
      if (!book?.categories) return [];
      return book.categories
        .map((bc: any) => bc.categoryId || bc.category?.id)
        .filter(Boolean);
    },
  );

  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการแก้ไข");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border/85 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <h2 className="text-lg font-semibold">แก้ไขข้อมูลหนังสือ</h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto text-left"
        >
          {errorMsg && (
            <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              ชื่อหนังสือ *
            </label>
            <Input
              name="title"
              defaultValue={book.title}
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              ผู้เขียน / หน่วยงาน
            </label>
            <Input
              name="author"
              defaultValue={book.author || ""}
              className="bg-background/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    หมวดหมู่หนังสือ * (เลือกได้มากกว่า 1 หมวดหมู่)
                  </label>
                  <span className="text-[10px] text-primary font-medium">
                    เลือกแล้ว {selectedCategoryIds.length} หมวดหมู่
                  </span>
                </div>

                {/* 1. แสดงรายการที่เลือกไว้แล้วเป็น Badge ด้านบน */}
                {selectedCategoryIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 border border-border/60 rounded-xl">
                    {selectedCategoryIds.map((id) => {
                      const cat = categories.find((c) => c.id === id);
                      if (!cat) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {cat.name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCategoryIds(
                                selectedCategoryIds.filter(
                                  (item) => item !== id,
                                ),
                              )
                            }
                            className="hover:text-destructive transition-colors ml-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 2. ช่องพิมพ์ค้นหาหมวดหมู่ */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="พิมพ์เพื่อค้นหาหมวดหมู่..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <svg
                    className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* 3. กล่องรายการหมวดหมู่ที่กรองตามคำค้นหา */}
                <div className="border border-input rounded-xl bg-background/50 max-h-44 overflow-y-auto p-1.5 space-y-1">
                  {categories && categories.length > 0 ? (
                    categories
                      .filter((cat) =>
                        cat.name
                          .toLowerCase()
                          .includes(categorySearch.toLowerCase()),
                      )
                      .map((cat) => {
                        const isSelected = selectedCategoryIds.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-muted/60 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategoryIds([
                                      ...selectedCategoryIds,
                                      cat.id,
                                    ]);
                                  } else {
                                    setSelectedCategoryIds(
                                      selectedCategoryIds.filter(
                                        (item) => item !== cat.id,
                                      ),
                                    );
                                  }
                                }}
                                className="rounded border-input text-primary focus:ring-primary size-4"
                              />
                              <span>{cat.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {cat.slug}
                            </span>
                          </label>
                        );
                      })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      ไม่พบหมวดหมู่ที่ค้นหา
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Slug (URL Path)
              </label>
              <Input
                name="slug"
                defaultValue={book.slug}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              เปลี่ยนไฟล์หนังสือ (.pdf / .epub) - หากไม่เลือกจะใช้ไฟล์เดิม
            </label>
            <Input
              type="file"
              name="file"
              accept=".pdf,.epub"
              className="bg-background/50 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              เปลี่ยนรูปภาพปก (ไม่บังคับ)
            </label>
            <Input
              type="file"
              name="cover"
              accept="image/*"
              className="bg-background/50 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ชนิดไฟล์
              </label>
              <select
                name="fileType"
                defaultValue={book.fileType}
                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm"
              >
                <option value="PDF">PDF</option>
                <option value="EPUB">EPUB</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                สถานะ
              </label>
              <select
                name="status"
                defaultValue={book.status}
                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm"
              >
                <option value="PUBLISHED">เผยแพร่แล้ว (Published)</option>
                <option value="DRAFT">ฉบับร่าง (Draft)</option>
              </select>
            </div>
          </div>

          {/* Hidden Inputs เพื่อให้ FormData ส่ง categoryIds ไปหลังบ้านได้ */}
          {selectedCategoryIds.map((id) => (
            <input key={id} type="hidden" name="categoryIds" value={id} />
          ))}

          <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading} className="gap-2 px-6">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-primary"
      >
        <Pencil className="size-4" />
      </Button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
