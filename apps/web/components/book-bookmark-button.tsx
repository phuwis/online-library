"use client";

import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/features/library/local-library";

/**
 * ปุ่มบุ๊กมาร์ก (ใช้ hook กลาง → ซิงก์กับหน้าแรก/หน้าหนังสือทั้งหมดอัตโนมัติ)
 * - variant "ribbon": ริบบิ้นบนมุมปกหนังสือ
 * - variant "button": ปุ่มมีข้อความ (สำหรับพื้นหลังสีเข้ม)
 */
export function BookBookmarkButton({
  slug,
  title,
  variant = "ribbon",
}: {
  slug: string;
  title?: string;
  variant?: "ribbon" | "button";
}) {
  const { slugs, isBookmarked, toggle } = useBookmarks();
  // ก่อนอ่าน localStorage เสร็จ (slugs = null) แสดงเป็น "ยังไม่บุ๊กมาร์ก" ให้ตรงกับฝั่ง server
  const active = slugs !== null && isBookmarked(slug);
  const label = active ? "บุ๊กมาร์กแล้ว" : "บุ๊กมาร์ก";
  const aria = `${active ? "เอาบุ๊กมาร์กออก" : "บุ๊กมาร์ก"}${title ? `: ${title}` : ""}`;

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => toggle(slug)}
        aria-pressed={active}
        aria-label={aria}
        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
          active
            ? "border-amber-300/60 bg-amber-400/20 text-amber-200 hover:bg-amber-400/30"
            : "border-white/25 bg-white/5 text-white hover:bg-white/15"
        }`}
      >
        <Bookmark
          className={`size-4 ${active ? "fill-amber-300 text-amber-300" : ""}`}
        />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={active}
      aria-label={aria}
      title={active ? "เอาบุ๊กมาร์กออก" : "บุ๊กมาร์กไว้อ่านภายหลัง"}
      className="absolute -top-1 left-3 z-20 transition-transform hover:scale-110 focus-visible:scale-110"
    >
      <Bookmark
        className={`size-9 drop-shadow-lg ${
          active
            ? "fill-amber-400 text-amber-400"
            : "fill-black/30 text-white/90 hover:text-amber-300"
        }`}
      />
    </button>
  );
}
