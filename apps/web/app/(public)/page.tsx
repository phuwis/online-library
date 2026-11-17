import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { listPublishedBooks } from "@/features/books/queries";
import { ArrowRight, Building, Sparkles } from "lucide-react";
import { ContinueReadingSection } from "@/components/continue-reading-section";
import { BookmarkSection } from "@/components/bookmark-section";
import { InteractiveBookshelf } from "@/components/interactive-bookshelf";
import { ScrollIndicatorIcon } from "@/components/scroll-indicator-icon";

export const dynamic = "force-dynamic";

const HOME_CONTENT = {
  hero: {
    badge:
      "ห้องสมุดดิจิทัลอัจฉริยะ • สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย",
    titlePrefix: "คลังปัญญาและเอกสารวิชาการ",
    titleHighlight: "เพื่อการพัฒนาเชิงพื้นที่",
    description:
      "แหล่งรวบรวมองค์ความรู้ คู่มือการปฏิบัติงาน และผลงานวิชาการสำคัญ พร้อมให้คุณค้นคว้าและอ่านออนไลน์ได้ทันทีทุกที่ทุกเวลา",
    scrollHint: "เลื่อนลงเพื่อสำรวจชั้นหนังสือ",
  },
};

/**
 * Stacking parallax:
 * (จอ lg ขึ้นไป) ทุก section เป็น `sticky top-16` (ใต้ header สูง 4rem) ความสูงเต็มจอ → section ปัจจุบันถูกล็อกไว้กับที่
 * ส่วน section ถัดไป (z-index สูงกว่า) จะเลื่อนขึ้นมาทับเอง
 */
const STACK_BASE =
  "relative lg:sticky lg:top-16 w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)]";

/**
 * Section ที่เลื่อนมาทับ: outer = sticky (ไม่มี overflow เพื่อให้ไอคอนที่ยื่นขอบบนไม่โดนตัด)
 * inner = ไม่มี scroll ซ้อน (จอเล็กกว่า lg ปล่อยให้ไหลตามปกติ ไม่ซ้อนทับ)
 */
function StackSection({
  z,
  borderClass,
  icon,
  children,
}: {
  z: string;
  borderClass: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`${STACK_BASE} ${z} bg-background dark:bg-slate-950 border-t ${borderClass} shadow-[0_-20px_50px_rgba(0,0,0,0.35)]`}
    >
      {icon}
      <div className="min-h-[inherit] lg:h-full lg:overflow-clip py-12 px-3 sm:px-6 md:px-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full my-auto">{children}</div>
      </div>
    </section>
  );
}

const SECTION_COUNT = 4;

export default async function HomePage() {
  const { items } = await listPublishedBooks({ take: 20 });

  return (
    // ไม่มี scroll container ของตัวเอง: ใช้ scroll ของหน้า (window) ตัวเดียวร่วมกับ layout
    // → footer ต่อท้ายตามธรรมชาติ ไม่เกิด scroll ซ้อน/ติด
    <div className="relative w-full">
      {/*
        Snap แบบ native ของเบราว์เซอร์ (ไม่ดัก wheel ด้วย JS แล้ว → ทัชแพดทำงานปกติ)
        - เปิดเฉพาะจอ lg ขึ้นไป และเฉพาะหน้านี้ (style หายไปเมื่อออกจากหน้า)
        - scroll-padding-top = ความสูง header (4rem)
        - snap-stop: always = เลื่อนแรงแค่ไหนก็หยุดทีละ section
        - ใช้ anchor แยก (ไม่ใช่ตัว section) เพราะ section เป็น sticky ซึ่งตีกับ scroll-snap
      */}
      <style>{`@media (min-width:1024px){html{scroll-snap-type:y mandatory;scroll-padding-top:4rem}}`}</style>
      {Array.from({ length: SECTION_COUNT }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="hidden lg:block absolute inset-x-0 snap-start snap-always pointer-events-none"
          style={{
            top: `calc(${i} * (100dvh - 4rem))`,
            height: "calc(100dvh - 4rem)",
          }}
        />
      ))}

      {/* Section 1: Hero (ถูกล็อกไว้ แล้ว section 2 เลื่อนมาทับ) */}
      <section
        className={`${STACK_BASE} z-0 overflow-clip bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 dark:from-purple-950/90 dark:via-purple-900/80 dark:to-indigo-950/90 text-white flex flex-col justify-between items-center py-12`}
      >
        {/* Abstract Background Layers */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#c084fc_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -top-32 -right-32 size-[30rem] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-[30rem] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />

        <div />

        {/* เนื้อหาหลักตรงกลาง */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col items-center text-center my-auto pb-12">
          <div className="space-y-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs sm:text-sm font-medium border border-white/15 shadow-lg">
              <Sparkles
                className="size-4 text-yellow-400 animate-spin"
                style={{ animationDuration: "6s" }}
              />
              <span>{HOME_CONTENT.hero.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.15] text-white drop-shadow-md">
              {HOME_CONTENT.hero.titlePrefix}{" "}
              <span className="text-purple-300 block sm:inline mt-1 sm:mt-0">
                {HOME_CONTENT.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-base sm:text-xl text-purple-100/90 leading-relaxed max-w-2xl mx-auto font-light">
              {HOME_CONTENT.hero.description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="rounded-2xl shadow-xl bg-white text-purple-950 hover:bg-purple-100 font-bold px-8 py-6 text-base transition-all duration-300 hover:scale-105"
              >
                <Link href="/books" className="flex items-center gap-2.5">
                  <span>สำรวจชั้นหนังสือทั้งหมด</span>
                  <ArrowRight className="size-5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border-purple-300/60 bg-purple-900/40 text-white hover:bg-purple-800/60 backdrop-blur-md font-semibold px-8 py-6 text-base transition-all duration-300 shadow-sm"
              >
                <Link href="/about" className="flex items-center gap-2.5">
                  <Building className="size-5 text-purple-200" />
                  <span>เกี่ยวกับสถาบันดำรงราชานุภาพ</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ข้อความชวนเลื่อน */}
        <div className="relative z-10 flex flex-col items-center gap-1 pb-6 cursor-default">
          <span className="text-sm font-bold tracking-widest text-purple-200 uppercase drop-shadow-md">
            {HOME_CONTENT.hero.scrollHint}
          </span>
          <div className="w-1.5 h-3 bg-purple-300 rounded-full animate-bounce mt-1 shadow" />
        </div>
      </section>

      {/* Section 2: หนังสือที่อ่านค้างไว้ */}
      <StackSection
        z="z-10"
        borderClass="border-purple-500/20 dark:border-purple-400/20"
        icon={<ScrollIndicatorIcon />}
      >
        <ContinueReadingSection allBooks={items} />
      </StackSection>

      {/* Section 3: บุ๊กมาร์ก */}
      <StackSection z="z-20" borderClass="border-border/80">
        <BookmarkSection allBooks={items} />
      </StackSection>

      {/* Section 4: Interactive Bookshelf */}
      <StackSection z="z-30" borderClass="border-border/80">
        <InteractiveBookshelf books={items} />
      </StackSection>
    </div>
  );
}
