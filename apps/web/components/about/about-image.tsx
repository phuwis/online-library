import Image from "next/image";
import {
  BookOpen,
  Building2,
  Crown,
  GraduationCap,
  Landmark,
  Library,
  Map as MapIcon,
  ScrollText,
  Users,
} from "lucide-react";

/**
 * ช่องภาพของหน้า "เกี่ยวกับเรา"
 * - มี src → แสดงภาพจริง พร้อมปรับโทนม่วงอ่อนๆ ให้ทุกภาพในหน้าดูเป็นชุดเดียวกัน
 * - src = null → แสดงภาพประกอบโทนม่วง (ลายไทยเรขาคณิต + ไอคอน + คำบอกว่าควรใส่ภาพอะไร)
 *   หน้าเว็บจึงดูสมบูรณ์ตั้งแต่ยังไม่มีภาพจริง
 *
 * ใส่ภาพจริง: วางไฟล์ไว้ใน apps/web/public/files/about/ แล้วตั้ง src เช่น "/files/about/library.jpg"
 * (ใช้เฉพาะภาพที่หน่วยงานมีสิทธิ์เผยแพร่)
 */

const ICONS = {
  crown: Crown,
  landmark: Landmark,
  library: Library,
  book: BookOpen,
  college: GraduationCap,
  people: Users,
  building: Building2,
  map: MapIcon,
  scroll: ScrollText,
};

export type AboutIcon = keyof typeof ICONS;

export type ImageSlot = {
  /** path ภาพใน public/ หรือ null = ยังไม่มีภาพ */
  src: string | null;
  alt: string;
  /** คำอธิบายภาพที่ควรใส่ (แสดงบนภาพประกอบตอนยังไม่มีภาพ) */
  hint: string;
  icon: AboutIcon;
};

/** ลายเรขาคณิตแบบลายประจำยาม (SVG pattern ฝังในหน้า) */
const LAI_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23e9d5ff' stroke-width='1'%3E%3Cpath d='M28 6 L50 28 L28 50 L6 28 Z'/%3E%3Cpath d='M28 16 L40 28 L28 40 L16 28 Z'/%3E%3Ccircle cx='28' cy='28' r='3'/%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Ccircle cx='56' cy='0' r='4'/%3E%3Ccircle cx='0' cy='56' r='4'/%3E%3Ccircle cx='56' cy='56' r='4'/%3E%3C/g%3E%3C/svg%3E")`;

export function AboutImage({
  slot,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
  className = "",
  showHint = true,
}: {
  slot: ImageSlot;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** แสดงไอคอนและคำบอกภาพบนภาพประกอบ (false = เหลือแค่ลาย ใช้กับภาพพื้นหลังที่มีข้อความทับ) */
  showHint?: boolean;
}) {
  const Icon = ICONS[slot.icon];

  if (slot.src) {
    return (
      <div className={`relative overflow-hidden bg-purple-950 ${className}`}>
        <Image
          src={slot.src}
          alt={slot.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
        {/* ปรับโทนให้เข้าธีม */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/45 via-purple-900/10 to-transparent mix-blend-multiply" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={slot.alt}
      className={`relative overflow-hidden bg-gradient-to-br from-purple-900 via-[#3b1466] to-indigo-950 ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.13]"
        style={{ backgroundImage: LAI_PATTERN, backgroundSize: "56px 56px" }}
      />
      <div
        aria-hidden
        className="absolute -top-1/4 -right-1/4 size-3/4 rounded-full bg-fuchsia-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-1/4 -left-1/4 size-3/4 rounded-full bg-amber-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-3 sm:inset-4 rounded-[inherit] border border-amber-200/20"
      />

      {showHint && (
        <div className="relative flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-16 sm:size-20 items-center justify-center rounded-2xl border border-amber-200/30 bg-white/5 text-amber-200/90 shadow-inner backdrop-blur-sm">
            <Icon className="size-8 sm:size-10" strokeWidth={1.4} />
          </span>
          <span className="max-w-[16rem] rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] leading-snug text-purple-100/75">
            ภาพ: {slot.hint}
          </span>
        </div>
      )}
    </div>
  );
}
