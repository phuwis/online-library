"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { RotateCcw, X, Loader2, AlertTriangle, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

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
  books?: BookCategoryRelation[];
}

export function ResetCategoryBooksModal({ category }: { category: Category }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ดึงรายชื่อหนังสือทั้งหมดที่ผูกอยู่กับหมวดหมู่นี้
  const affectedBooks = category.books?.map((bc) => bc.book) || [];

  async function handleResetCategory() {
    if (confirmText !== "RESET") return;

    setLoading(true);
    setErrorMsg("");

    try {
      // ส่งคำขอไปยัง API เพื่อปลดหมวดหมู่นี้ออกจากหนังสือทุกเล่ม
      const res = await apiFetch(`/api/categories/${category.id}/clear-books`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setIsOpen(false);
        setConfirmText("");
        router.refresh();
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการล้างหมวดหมู่");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border/85 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <h2 className="text-base font-semibold text-foreground">
              ล้างหมวดหมู่จากหนังสือทั้งหมด
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-8"
            onClick={() => {
              setIsOpen(false);
              setConfirmText("");
            }}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-left">
          {errorMsg && (
            <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg">
              {errorMsg}
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            คุณกำลังจะนำหมวดหมู่{" "}
            <strong className="text-foreground font-semibold">
              "{category.name}"
            </strong>{" "}
            ออกจากหนังสือทุกเล่มด้านล่างนี้:
          </p>

          {/* ตารางขนาดเล็กแสดงรายชื่อหนังสือที่จะได้รับผลกระทบ */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              หนังสือที่เกี่ยวข้อง ({affectedBooks.length} เล่ม):
            </span>
            <div className="border border-border/60 rounded-xl bg-muted/25 max-h-40 overflow-y-auto p-2 space-y-1">
              {affectedBooks.length > 0 ? (
                affectedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-2 text-xs px-2.5 py-1.5 bg-background rounded-lg border border-border/40 shadow-2xs"
                  >
                    <BookOpen className="size-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {book.title}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  ไม่มีหนังสือเล่มใดที่ใช้หมวดหมู่นี้อยู่
                </p>
              )}
            </div>
          </div>

          {/* ช่องพิมพ์ยืนยันคำว่า RESET */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs text-muted-foreground block">
              พิมพ์คำว่า{" "}
              <span className="font-bold text-destructive font-mono">
                RESET
              </span>{" "}
              เพื่อยืนยันการเคลียร์หมวดหมู่นี้:
            </label>
            <Input
              type="text"
              placeholder="พิมพ์ RESET ที่นี่..."
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())} // แปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติทันทีที่พิมพ์
              className="bg-background/50 h-10 font-mono tracking-widest text-center uppercase"
            />
          </div>

          {/* ปุ่ม Action */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setConfirmText("");
              }}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleResetCategory}
              disabled={
                confirmText.trim().toUpperCase() !== "RESET" ||
                loading ||
                affectedBooks.length === 0
              }
              className="gap-1.5 px-4"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              ยืนยันการล้างหมวดหมู่
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="ล้างหมวดหมู่นี้ออกจากหนังสือทุกเล่ม"
      >
        <RotateCcw className="size-4" />
      </Button>

      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
