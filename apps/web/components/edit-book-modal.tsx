"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Pencil, X, Loader2 } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  slug: string;
  fileType: string;
  status: string;
}

export function EditBookModal({ book }: { book: Book }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  // เช็คเพื่อให้แน่ใจว่าเรดเดอร์ฝั่ง Client เท่านั้น (ป้องกัน Hydration Error)
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
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
        onClick={() => setIsOpen(true)}
        aria-label="แก้ไขหนังสือ"
      >
        <Pencil className="size-4" />
      </Button>

      {/* ใช้ createPortal ดีด Modal ไปแปะไว้ที่ document.body โดยตรง หลุดพ้นจากข้อจำกัดของตาราง */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border/85 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
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
                    defaultValue={book.author}
                    className="bg-background/50"
                  />
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

                <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2 px-6"
                  >
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
