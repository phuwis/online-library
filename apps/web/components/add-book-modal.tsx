"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Plus,
  X,
  Loader2,
  Image as ImageIcon,
  Bold,
  Heading1,
  Heading2,
  List,
  Quote,
  Minus,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Category } from "@/types/book";
import { MarkdownPreview } from "./markdown-preview";

// รายการหมวดหมู่สากล DDC (Dewey Decimal Classification)
const DDC_OPTIONS = [
  { value: "GENERAL_000", label: "000 - เบ็ดเตล็ด / ความรู้ทั่วไป" },
  { value: "PHILOSOPHY_100", label: "100 - ปรัชญาและจิตวิทยา" },
  { value: "RELIGION_200", label: "200 - ศาสนา" },
  { value: "SOCIAL_SCIENCES_300", label: "300 - สคมศาสตร์" },
  { value: "LANGUAGE_400", label: "400 - ภาษาศาสตร์" },
  { value: "SCIENCE_500", label: "500 - วิทยาศาสตร์และคณิตศาสตร์" },
  { value: "TECHNOLOGY_600", label: "600 - เทคโนโลยี / วิทยาศาสตร์ประยุกต์" },
  { value: "ARTS_RECREATION_700", label: "700 - ศิลปะและการบันเทิง / กีฬา" },
  { value: "LITERATURE_800", label: "800 - วรรณกรรม / วรรณคดี" },
  { value: "HISTORY_GEOGRAPHY_900", label: "900 - ภูมิศาสตร์และประวัติศาสตร์" },
];

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

  // State สำหรับช่อง description เพื่อให้ควบคุมการแทรกปุ่ม Markdown ได้ง่ายขึ้น
  const [description, setDescription] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // ฟังก์ชันช่วยแทรก Markdown จาก Toolbar อัตโนมัติ
  const insertMarkdown = (
    syntaxBefore: string,
    syntaxAfter = "",
    defaultText = "",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || defaultText;

    const replacement = `${syntaxBefore}${selectedText}${syntaxAfter}`;
    const newText =
      text.substring(0, start) + replacement + text.substring(end);

    setDescription(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + selectedText.length,
      );
    }, 0);
  };

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

    // บังคับส่งค่า description จาก state ควบคุม
    formData.set("description", description);

    // ถ้าผู้ใช้ไม่ได้เลือกสถานะ ให้บังคับเป็น DRAFT
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
        setDescription("");
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
            type="button"
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

          {/* ข้อมูลบรรณานุกรม 4 ช่อง */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                สำนักที่ตีพิมพ์ (Publisher)
              </label>
              <Input
                name="publisher"
                placeholder="เช่น สำนักพิมพ์..."
                className="bg-background/50 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                ปีและจำนวนที่ตีพิมพ์ (Publication Info)
              </label>
              <Input
                name="publicationInfo"
                placeholder="เช่น 2567 / พิมพ์ครั้งที่ 1"
                className="bg-background/50 h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                จำนวนหน้า (Page Count)
              </label>
              <Input
                name="pageCount"
                placeholder="เช่น 150 หน้า"
                className="bg-background/50 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                จังหวัดที่ตีพิมพ์ (Publishing Province)
              </label>
              <Input
                name="publishingProvince"
                placeholder="เช่น กรุงเทพมหานคร"
                className="bg-background/50 h-10"
              />
            </div>
          </div>

          {/* หมวดหมู่สากล DDC */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              หมวดหมู่สากล DDC *
            </label>
            <select
              name="ddc"
              defaultValue="GENERAL_000"
              required
              className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
            >
              {DDC_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-card text-foreground py-1"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* หมวดหมู่หนังสือทั่วไป */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              หมวดหมู่หนังสือทั่วไป * (เลือกได้มากกว่า 1 หมวดหมู่)
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
          </div>

          {/* 🌟 รายละเอียดหนังสือ พร้อม Toolbar ช่วยกดจัดรูปแบบ (Markdown Editor แบบง่าย) */}
          <div className="space-y-4">
            <label className="text-xs font-medium text-foreground">
              รายละเอียดหนังสือ / เรื่องย่อ (รองรับ Markdown)
            </label>

            {/* 🛠️ Toolbar สำหรับผู้ใช้ที่ไม่ถนัดเขียนโค้ด */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1.5 rounded-t-xl border border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium"
                onClick={() => insertMarkdown("# ", "", "หัวข้อหลัก")}
              >
                <Heading1 className="size-3.5 mr-1" /> หัวข้อ 1
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium"
                onClick={() => insertMarkdown("### ", "", "หัวข้อย่อย")}
              >
                <Heading2 className="size-3.5 mr-1" /> หัวข้อ 2
              </Button>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => insertMarkdown("**", "**", "ข้อความตัวหนา")}
              >
                <Bold className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => insertMarkdown("* ", "", "รายการย่อย")}
              >
                <List className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => insertMarkdown("> ", "", "ข้อความอ้างอิง")}
              >
                <Quote className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => insertMarkdown("\n---\n", "", "")}
              >
                <Minus className="size-3.5" />
              </Button>
            </div>

            {/* ช่องกรอกข้อความ (Textarea) */}
            <Textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="พิมพ์รายละเอียด หรือกดปุ่มเครื่องมือด้านบน..."
              className="rounded-t-none bg-background/55 text-xs sm:text-sm leading-relaxed font-mono"
            />

            {/* 🌟 ช่องแสดงตัวอย่าง (Preview Box) แบบ Real-time */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground">
                🔍 หน้าตาที่จะแสดงผลจริงฝั่งผู้ใช้งาน (Live Preview):
              </span>
              <MarkdownPreview content={description} />
            </div>
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
                className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
              >
                <option value="PDF" className="bg-card text-foreground">
                  PDF
                </option>
                <option value="EPUB" className="bg-card text-foreground">
                  EPUB
                </option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                สถานะ
              </label>
              <select
                name="status"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
                defaultValue="DRAFT"
              >
                <option value="PUBLISHED" className="bg-card text-foreground">
                  เผยแพร่ทันที (Published)
                </option>
                <option value="DRAFT" className="bg-card text-foreground">
                  ฉบับร่าง (Draft)
                </option>
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
