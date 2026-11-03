"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Plus, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// แก้ไขจุดนี้: ใช้ Worker ที่มากับตัวแพ็กเกจใน node_modules โดยตรงผ่าน Next.js asset/resource หรือใช้ URL ตรงของ local worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

export function AddBookModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // เก็บสถานะไฟล์ปกที่ถูกสร้างอัตโนมัติ หรือไฟล์ที่แอดมินเลือกเอง
  const [autoCoverFile, setAutoCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // ฟังก์ชันแปลงหน้าแรกของ PDF เป็นรูปภาพอัตโนมัติ
  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    setGeneratingCover(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      // ดึงหน้าแรกของ PDF
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 }); // ปรับความคมชัดของปก

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvas, canvasContext: context, viewport }).promise;

        // แปลง Canvas เป็น File (Blob) เพื่อส่งไปกับ FormData
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const coverFile = new File([blob], "auto-cover.jpg", {
                type: "image/jpeg",
              });
              setAutoCoverFile(coverFile);
              setCoverPreview(URL.createObjectURL(blob)); // แสดงตัวอย่างรูปปก
            }
            setGeneratingCover(false);
          },
          "image/jpeg",
          0.85,
        );
      }
    } catch (err) {
      console.error("Error generating PDF cover:", err);
      setGeneratingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);

    // หากไม่ได้อัปโหลดรูปปกแยกเอง แต่มีรูปปกที่ระบบ Gen ให้จาก PDF ให้นำใส่ FormData แทน
    const manualCover = formData.get("cover") as File;
    if ((!manualCover || manualCover.size === 0) && autoCoverFile) {
      formData.set("cover", autoCoverFile);
    }

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setIsOpen(false);
        setAutoCoverFile(null);
        setCoverPreview(null);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setErrorMsg(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 shadow-md">
        <Plus className="size-4" /> เพิ่มหนังสือใหม่
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/85 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-lg font-semibold">เพิ่มหนังสือใหม่</h2>
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
                  placeholder="ระบุชื่อหนังสือ..."
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
                  placeholder="ระบุชื่อผู้เขียน..."
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Slug (URL Path ไม่บังคับ)
                </label>
                <Input
                  name="slug"
                  placeholder="เช่น book-name-2569"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  อัปโหลดไฟล์หนังสือ (.pdf / .epub) *
                </label>
                <Input
                  type="file"
                  name="file"
                  accept=".pdf,.epub"
                  required
                  onChange={handlePdfChange}
                  className="bg-background/50 cursor-pointer"
                />
              </div>

              {/* ส่วนแสดงสถานะและตัวอย่างรูปปกที่ Gen อัตโนมัติ หรือเลือกอัปโหลดทับ */}
              <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-4 text-primary" />{" "}
                    รูปภาพปกหนังสือ (สร้างจากหน้าแรก PDF อัตโนมัติ)
                  </span>
                  {generatingCover && (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" />{" "}
                      กำลังสร้างรูปปก...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {coverPreview ? (
                    <div className="w-16 h-20 rounded border overflow-hidden shrink-0 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPreview}
                        alt="Auto Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-20 rounded border bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                      <FileText className="size-6 opacity-40" />
                    </div>
                  )}

                  <div className="flex-grow space-y-1">
                    <label className="text-[11px] text-muted-foreground">
                      ต้องการเปลี่ยนรูปปกเฉพาะ (ไม่บังคับ):
                    </label>
                    <Input
                      type="file"
                      name="cover"
                      accept="image/*"
                      className="bg-background/50 cursor-pointer text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    ชนิดไฟล์
                  </label>
                  <select
                    name="fileType"
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
                    className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm"
                  >
                    <option value="PUBLISHED">เผยแพร่ทันที (Published)</option>
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
                  disabled={loading || generatingCover}
                  className="gap-2 px-6"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
