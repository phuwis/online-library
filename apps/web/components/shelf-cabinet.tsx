"use client";

/**
 * ชิ้นส่วน UI ที่ section ในหน้าแรกใช้ร่วมกัน (อ่านค้าง / บุ๊กมาร์ก / ชั้นหนังสือ)
 * - SectionHeading: หัวข้อ section ในกรอบขาวแบบกระจก
 * - ShelfCabinet:   ตู้หนังสือ (แถบหัว + พื้นที่วางหนังสือ + ฐานตู้) มี 3 โทนสี
 * - ShelfScroller:  พื้นที่เลื่อนแนวนอน พร้อมปุ่มเลื่อนซ้าย/ขวา (แสดงเฉพาะเมื่อเลื่อนได้)
 * - TwoRowShelf:    หนังสือ 2 ชั้น (2 แถว) เลื่อนแนวนอนไปพร้อมกัน
 * - SHELF_BOOK_W:   ความกว้างหนังสือมาตรฐานบนชั้น (ใช้ทุก section ให้ขนาดเท่ากัน)
 * - ShelfArrow / ShelfPlank / ShelfCoverFallback / BookTitle: ชิ้นเล็กที่ใช้ซ้ำ
 */

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export type ShelfTone = "purple" | "gold" | "indigo";

/** ความกว้างหนังสือ 1 เล่มบนชั้น (ปก 3:4) — ขนาดนี้ทำให้ 2 ชั้นพอดีจอ */
export const SHELF_BOOK_W = "w-[118px] sm:w-[128px]";

// ───────────────────────── Section heading ─────────────────────────

const HEADING_ICON: Record<ShelfTone, string> = {
  purple: "bg-primary/10 text-primary",
  gold: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
};

export function SectionHeading({
  tone,
  icon,
  title,
  subtitle,
  actions,
}: {
  tone: ShelfTone;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/90 dark:border-white/10 bg-white/85 dark:bg-slate-900/70 backdrop-blur-md shadow-[0_8px_30px_rgba(88,28,135,0.10)] px-4 py-3 sm:px-5 sm:py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`p-2.5 rounded-xl shrink-0 ${HEADING_ICON[tone]}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>
      {actions && (
        <div className="shrink-0 self-end sm:self-auto">{actions}</div>
      )}
    </div>
  );
}

// ───────────────────────── Cabinet ─────────────────────────

const CABINET: Record<
  ShelfTone,
  {
    frame: string;
    head: string;
    headText: string;
    pill: string;
    foot: string;
    footText: string;
    trim?: string;
  }
> = {
  purple: {
    frame:
      "border-purple-900/30 dark:border-purple-700/40 bg-gradient-to-b from-purple-950/90 via-purple-900/80 to-indigo-950/90",
    head: "bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 border-purple-700/40",
    headText: "text-purple-100",
    pill: "bg-white/10 text-purple-200 border-white/10",
    foot: "bg-gradient-to-b from-purple-950 to-indigo-950 border-purple-700/40",
    footText: "text-purple-300/80",
  },
  gold: {
    frame:
      "border-amber-400/40 dark:border-amber-400/30 bg-gradient-to-b from-[#2a0f45] via-purple-900/90 to-[#2a0f45]",
    head: "bg-gradient-to-r from-[#2a0f45] via-purple-900 to-[#2a0f45] border-amber-400/30",
    headText: "text-amber-100",
    pill: "bg-amber-400/15 text-amber-200 border-amber-400/30",
    foot: "bg-gradient-to-b from-[#2a0f45] to-purple-950 border-amber-400/30",
    footText: "text-amber-200/70",
    trim: "via-amber-300/80",
  },
  indigo: {
    frame:
      "border-indigo-400/30 dark:border-indigo-500/30 bg-gradient-to-b from-indigo-950/95 via-violet-900/85 to-purple-950/95",
    head: "bg-gradient-to-r from-indigo-950 via-violet-900 to-indigo-950 border-indigo-400/30",
    headText: "text-indigo-100",
    pill: "bg-indigo-300/15 text-indigo-100 border-indigo-300/25",
    foot: "bg-gradient-to-b from-indigo-950 to-[#1e1240] border-indigo-400/30",
    footText: "text-indigo-200/75",
    trim: "via-cyan-300/60",
  },
};

export function ShelfCabinet({
  tone,
  label,
  title,
  badge,
  footerLeft,
  footerRight,
  decoration,
  children,
}: {
  tone: ShelfTone;
  /** ป้ายภาษาอังกฤษตัวเล็กมุมซ้าย (ซ่อนบนมือถือ) */
  label: string;
  title: string;
  /** ป้ายมุมขวาของแถบหัว เช่น "6 เล่ม" */
  badge: React.ReactNode;
  footerLeft: React.ReactNode;
  footerRight?: React.ReactNode;
  /** ของตกแต่งที่ยื่นออกนอกตู้ (เช่น ริบบิ้น) */
  decoration?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = CABINET[tone];
  return (
    <div className="relative">
      {decoration}
      <div
        className={`relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 text-white ${t.frame}`}
      >
        {t.trim && (
          <div
            className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${t.trim} to-transparent`}
          />
        )}
        <div
          className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-bold shadow-inner border-b flex items-center justify-between gap-3 ${t.head} ${t.headText}`}
        >
          <span className="opacity-75 text-xs uppercase tracking-widest hidden sm:inline">
            {label}
          </span>
          <span className="drop-shadow-md sm:mx-auto truncate">{title}</span>
          <span
            className={`px-3 py-0.5 rounded-full text-xs border shrink-0 min-w-14 text-center ${t.pill}`}
          >
            {badge}
          </span>
        </div>

        <div className="relative px-4 py-5 sm:px-8 sm:py-6">{children}</div>

        <div
          className={`relative min-h-7 py-1 border-t shadow-inner flex items-center justify-between gap-3 px-4 sm:px-6 text-[11px] ${t.foot} ${t.footText}`}
        >
          <span className="truncate">{footerLeft}</span>
          {footerRight && <span className="shrink-0">{footerRight}</span>}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Horizontal scroller ─────────────────────────

export function ShelfArrow({
  direction,
  disabled,
  onClick,
  label,
  className = "",
}: {
  direction: "left" | "right";
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label ?? (direction === "left" ? "เลื่อนซ้าย" : "เลื่อนขวา")}
      className={`absolute top-[40%] -translate-y-1/2 z-20 hidden sm:flex size-10 items-center justify-center rounded-full bg-black/45 text-white border border-white/25 backdrop-blur-sm shadow-lg transition-opacity hover:bg-black/65 disabled:opacity-0 disabled:pointer-events-none ${
        direction === "left" ? "left-2" : "right-2"
      } ${className}`}
    >
      <Icon className="size-5" />
    </button>
  );
}

/** พื้นที่เลื่อนแนวนอน: ปุ่มลูกศรแสดงเฉพาะเมื่อมีเนื้อหาให้เลื่อน */
export function ShelfScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [can, setCan] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCan({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // จำนวนเล่มเปลี่ยน (เพิ่ม/ลบ) ก็ต้องคำนวณใหม่
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [update]);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <>
      {(can.left || can.right) && (
        <>
          <ShelfArrow
            direction="left"
            disabled={!can.left}
            onClick={() => scroll("left")}
          />
          <ShelfArrow
            direction="right"
            disabled={!can.right}
            onClick={() => scroll("right")}
          />
        </>
      )}
      <div
        ref={ref}
        onScroll={update}
        className="overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="w-max min-w-full">{children}</div>
      </div>
    </>
  );
}

/**
 * หนังสือ 2 ชั้น เรียงแบบชั้นวางจริง: เติมชั้นบนให้เต็มก่อน แล้วค่อยลงชั้นล่าง
 * ถ้าเกิน 2 ชั้นที่มองเห็น → แบ่งครึ่งบน/ล่างแล้วเลื่อนแนวนอน (ทั้ง 2 ชั้นเลื่อนพร้อมกัน)
 * ชั้นที่ไม่มีหนังสือยังแสดงไม้กระดานว่างไว้
 */
export function TwoRowShelf({
  tone,
  children,
}: {
  tone: ShelfTone;
  children: React.ReactNode;
}) {
  const items = Children.toArray(children);
  const boxRef = useRef<HTMLDivElement>(null);
  const [perRow, setPerRow] = useState<number | null>(null);

  // วัดว่า 1 ชั้นวางได้กี่เล่ม (ตรงกับ SHELF_BOOK_W และ gap ของแถว)
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const sm = window.matchMedia("(min-width: 640px)").matches;
      const [bookW, gap] = sm ? [128, 20] : [118, 16];
      setPerRow(
        Math.max(1, Math.floor((el.clientWidth + gap) / (bookW + gap))),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const split =
    perRow !== null && items.length <= perRow * 2
      ? perRow
      : Math.ceil(items.length / 2);
  const rows = [items.slice(0, split), items.slice(split)];

  return (
    <div ref={boxRef}>
      <ShelfScroller>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i}>
              <div className="flex items-start gap-4 sm:gap-5 px-1 min-h-[13.25rem] sm:min-h-[14rem]">
                {row}
              </div>
              <ShelfPlank tone={tone} />
            </div>
          ))}
        </div>
      </ShelfScroller>
    </div>
  );
}

// ───────────────────────── Small pieces ─────────────────────────

/** ไม้กระดานรองหนังสือ (วางใต้แถวหนังสือ) */
export function ShelfPlank({ tone }: { tone: ShelfTone }) {
  const glow =
    tone === "gold"
      ? "via-amber-300/50"
      : tone === "indigo"
        ? "via-cyan-200/40"
        : "via-purple-300/40";
  return (
    <div aria-hidden className="relative mt-0.5">
      <div
        className={`h-px bg-gradient-to-r from-transparent ${glow} to-transparent`}
      />
      <div className="h-2.5 rounded-b-md bg-gradient-to-b from-white/15 to-black/30 shadow-[0_10px_20px_rgba(0,0,0,0.35)]" />
    </div>
  );
}

/** ปกสำรองเมื่อหนังสือไม่มีรูปปก */
export function ShelfCoverFallback({ title }: { title: string }) {
  return (
    <div className="size-full flex flex-col items-center justify-center p-4 text-center text-xs text-white/70 bg-gradient-to-br from-white/10 to-white/0">
      <BookOpen className="size-8 mb-2 opacity-50" />
      <span className="line-clamp-3 font-medium">{title}</span>
    </div>
  );
}

/**
 * ชื่อหนังสือใต้ปก: ตัดที่ 2 บรรทัด และจองความสูงไว้ให้แถวตรงกัน
 * (หมายเหตุ: อย่าใส่ class `block` คู่กับ line-clamp เพราะจะทำให้ตัดบรรทัดไม่ทำงาน)
 */
export function BookTitle({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={`line-clamp-2 min-h-[2.5em] font-semibold text-xs sm:text-sm leading-snug ${className}`}
    >
      {title}
    </span>
  );
}
