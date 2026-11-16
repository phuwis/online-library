"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Pencil,
  X,
  Loader2,
  Bold,
  Heading1,
  Heading2,
  List,
  Quote,
  Minus,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Book, Category } from "@/types/book";
import { MarkdownPreview } from "./markdown-preview";

// รายการหมวดหมู่สากล DDC (Dewey Decimal Classification)
const DDC_OPTIONS = [
  { value: "GENERAL_000", label: "000 - เบ็ดเตล็ด / ความรู้ทั่วไป" },
  { value: "PHILOSOPHY_100", label: "100 - ปรัชญาและจิตวิทยา" },
  { value: "RELIGION_200", label: "200 - ศาสนา" },
  { value: "SOCIAL_SCIENCES_300", label: "300 - สังคมศาสตร์" },
  { value: "LANGUAGE_400", label: "400 - ภาษาศาสตร์" },
  { value: "SCIENCE_500", label: "500 - วิทยาศาสตร์และคณิตศาสตร์" },
  { value: "TECHNOLOGY_600", label: "600 - เทคโนโลยี / วิทยาศาสตร์ประยุกต์" },
  { value: "ARTS_RECREATION_700", label: "700 - ศิลปะและการบันเทิง / กีฬา" },
  { value: "LITERATURE_800", label: "800 - วรรณกรรม / วรรณคดี" },
  { value: "HISTORY_GEOGRAPHY_900", label: "900 - ภูมิศาสตร์และประวัติศาสตร์" },
];

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

  // State ควบคุมค่า description เพื่อให้ปุ่ม Toolbar แทรกข้อความได้ถูกต้อง
  const [description, setDescription] = useState(book.description || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);

    // บังคับส่งค่า description จาก state ควบคุม
    formData.set("description", description);

    // ล้างค่า categoryIds เดิมใน form แล้วใส่เข้าไปใหม่ให้ชัวร์ว่าเป็น Array ของ id ที่ถูกต้อง
    formData.delete("categoryIds");
    selectedCategoryIds.forEach((id) => {
      formData.append("categoryIds", id);
    });

    try {
      const res = await apiFetch(`/api/books/${book.slug}`, {
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
            type="button"
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

          {/* ข้อมูลบรรณานุกรมใหม่ 5 ข้อ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                สำนักที่ตีพิมพ์ (Publisher)
              </label>
              <Input
                name="publisher"
                defaultValue={book.publisher || ""}
                placeholder="เช่น สำนักพิมพ์..."
                className="bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ปีและจำนวนที่ตีพิมพ์ (Publication Info)
              </label>
              <Input
                name="publicationInfo"
                defaultValue={book.publicationInfo || ""}
                placeholder="เช่น 2567 / พิมพ์ครั้งที่ 1"
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                จำนวนหน้า (Page Count)
              </label>
              <Input
                name="pageCount"
                defaultValue={book.pageCount || ""}
                placeholder="เช่น 150 หน้า หรือ IV, 120"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                จังหวัดที่ตีพิมพ์ (Publishing Province)
              </label>
              <Input
                name="publishingProvince"
                defaultValue={book.publishingProvince || ""}
                placeholder="เช่น กรุงเทพมหานคร"
                className="bg-background/50"
              />
            </div>
          </div>

          {/* หมวดหมู่สากล DDC */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              หมวดหมู่สากล DDC *
            </label>
            <select
              name="ddc"
              defaultValue={book.ddc || "GENERAL_000"}
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

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    หมวดหมู่หนังสือทั่วไป * (เลือกได้มากกว่า 1 หมวดหมู่)
                  </label>
                  <span className="text-[10px] text-primary font-medium">
                    เลือกแล้ว {selectedCategoryIds.length} หมวดหมู่
                  </span>
                </div>

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
                className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
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
              <label className="text-xs font-medium text-muted-foreground">
                สถานะ
              </label>
              <select
                name="status"
                defaultValue={book.status}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all"
              >
                <option value="PUBLISHED" className="bg-card text-foreground">
                  เผยแพร่แล้ว (Published)
                </option>
                <option value="DRAFT" className="bg-card text-foreground">
                  ฉบับร่าง (Draft)
                </option>
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
