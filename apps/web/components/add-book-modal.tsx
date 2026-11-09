"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Plus, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

// ประกาศตัวแปรเก็บไลบรารี pdfjsLib แบบ Global ใน Client Component
let pdfjsLib: any = null;

export function AddBookModal({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // โหลด pdfjs-dist และตั้งค่า Worker เฉพาะฝั่ง Client (ป้องกัน Server-Side Rendering Error)
  useEffect(() => {
    import("pdfjs-dist").then((lib) => {
      pdfjsLib = lib;
      if (lib.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
      }
    });
  }, []);

  // กรองหมวดหมู่ตามช่องค้นหา
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCheckboxChange = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  // ฟังก์ชันแปลงหน้าแรก PDF เป็นรูปปกอัตโนมัติ
  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);

    if (!pdfjsLib) {
      alert("ระบบกำลังโหลดไลบรารี PDF กรุณารอสักครู่แล้วลองใหม่อีกครั้ง");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;

        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const coverBlobFile = new File([blob], "auto-cover.jpg", {
                type: "image/jpeg",
              });
              setCoverFile(coverBlobFile);
              setCoverPreview(URL.createObjectURL(blob));
            }
          },
          "image/jpeg",
          0.85,
        );
      }
    } catch (error) {
      console.error("Error generating pdf cover:", error);
    }
  }

  // ฟังก์ชันส่งฟอร์มบันทึกหนังสือใหม่
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    // ถ้าผู้ใช้ไม่ได้เลือกสถานะ (เผื่อกรณีฟอร์มไม่ได้กำหนด) ให้บังคับเป็น DRAFT
    if (!formData.get("status")) {
      formData.set("status", "DRAFT");
    }

    // ล้างค่า categoryIds เดิมที่อาจติดมา แล้วใส่ค่าที่เลือกจาก State ใหม่ทั้งหมด
    formData.delete("categoryIds");
    selectedCategoryIds.forEach((id) => {
      formData.append("categoryIds", id);
    });

    if (pdfFile) {
      formData.set("file", pdfFile);
    }
    if (coverFile) {
      formData.set("cover", coverFile);
    }

    try {
      const res = await apiFetch("/api/books", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setIsOpen(false);
        formElement.reset();
        setSelectedCategoryIds([]);
        setPdfFile(null);
        setCoverFile(null);
        setCoverPreview(null);
        router.refresh();
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  }

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border/85 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            เพิ่มหนังสือใหม่
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* ชื่อหนังสือ */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              ชื่อหนังสือ *
            </label>
            <Input
              name="title"
              placeholder="ระบุชื่อหนังสือ..."
              required
              className="bg-background/50 h-10"
            />
          </div>

          {/* ผู้แต่ง */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              ผู้เขียน / หน่วยงาน
            </label>
            <Input
              name="author"
              placeholder="ระบุชื่อผู้แต่ง..."
              className="bg-background/50 h-10"
            />
          </div>

          {/* หมวดหมู่ (Checkbox Multi-select) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              หมวดหมู่ * (เลือกได้มากกว่า 1 หมวดหมู่)
            </label>
            <div className="border border-border/60 rounded-xl p-3 bg-muted/20 space-y-2">
              <Input
                type="text"
                placeholder="พิมพ์เพื่อค้นหาหมวดหมู่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background h-9 text-xs"
              />
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {filteredCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-background/80 rounded-lg cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => handleCheckboxChange(cat.id)}
                      className="rounded border-border text-primary focus:ring-primary size-4"
                    />
                    <span className="font-medium text-foreground">
                      {cat.name}
                    </span>
                    <span className="text-muted-foreground ml-auto text-[11px] font-mono">
                      {cat.slug}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Hidden inputs เพื่อส่งค่า categoryIds ไปกับ FormData */}
            {selectedCategoryIds.map((id) => (
              <input key={id} type="hidden" name="categoryIds" value={id} />
            ))}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Slug (URL Path ไม่บังคับ)
            </label>
            <Input
              name="slug"
              placeholder="เช่น book-name-2569"
              className="bg-background/50 h-10 font-mono text-xs"
            />
          </div>

          {/* อัปโหลดไฟล์ PDF */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              อัปโหลดไฟล์หนังสือ (.pdf) *
            </label>
            <Input
              type="file"
              accept=".pdf"
              onChange={handlePdfChange}
              required
              className="bg-background/50 h-10 file:text-xs file:font-medium"
            />
          </div>

          {/* รูปปก */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              รูปภาพปกหนังสือ (สร้างจากหน้าแรก PDF อัตโนมัติ)
            </label>
            <div className="flex items-center gap-4 p-3 border border-border/60 rounded-xl bg-muted/10">
              <div className="size-16 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[11px] text-muted-foreground block">
                  ต้องการเปลี่ยนรูปปกเฉพาะ (ไม่บังคับ):
                </span>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setCoverFile(f);
                      setCoverPreview(URL.createObjectURL(f));
                    }
                  }}
                  className="bg-background/50 h-9 file:text-xs"
                />
              </div>
            </div>
          </div>

          {/* ชนิดไฟล์ & สถานะ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                ชนิดไฟล์
              </label>
              <select
                name="fileType"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-xs"
              >
                <option value="PDF">PDF</option>
                <option value="EPUB">EPUB</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                สถานะ
              </label>
              <select
                name="status"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-xs"
                defaultValue="DRAFT"
              >
                <option value="PUBLISHED">เผยแพร่ทันที (Published)</option>
                <option value="DRAFT">ฉบับร่าง (Draft)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="gap-1.5 px-5"
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              บันทึกข้อมูล
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="size-4" /> เพิ่มหนังสือใหม่
      </Button>

      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
