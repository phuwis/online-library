import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { listPublishedBooks } from "@/features/books/queries";
import { ArrowRight, Building, Sparkles } from "lucide-react";
import { ContinueReadingSection } from "@/components/continue-reading-section";
import { BookmarkSection } from "@/components/bookmark-section";
import { InteractiveBookshelf } from "@/components/interactive-bookshelf";
import { ScrollIndicatorIcon } from "@/components/scroll-indicator-icon";
import { HomeStepper, type HomeStep } from "@/components/home-stepper";

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
 * (variant `stack` = จอกว้าง ≥ 1024px และสูง ≥ 880px, ประกาศใน globals.css — ตู้หนังสือ 2 ชั้นต้องใช้ความสูงราว 800px)
 * ทุก section เป็น `sticky top-16` (ใต้ header สูง 4rem) ความสูงเต็มจอ → section ปัจจุบันถูกล็อกไว้กับที่
 * ส่วน section ถัดไป (z-index สูงกว่า) จะเลื่อนขึ้นมาทับเอง
 * จอที่เล็ก/เตี้ยกว่านั้น: section ไหลต่อกันตามความสูงเนื้อหา
 */
const STACK_MEDIA = "(min-width: 1024px) and (min-height: 880px)";
const STACK_BASE =
  "relative w-full stack:sticky stack:top-16 stack:h-[calc(100dvh-4rem)]";

/**
 * Section ที่เลื่อนมาทับ: outer = sticky (ไม่มี overflow เพื่อให้ไอคอนที่ยื่นขอบบนไม่โดนตัด)
 * inner = ไม่มี scroll ซ้อน (จอเล็กกว่า lg ปล่อยให้ไหลตามปกติ ไม่ซ้อนทับ)
 */
function StackSection({
  z,
  borderClass,
  icon,
  background,
  children,
}: {
  z: string;
  borderClass: string;
  icon?: React.ReactNode;
  /** ชั้นตกแต่งพื้นหลัง (absolute เต็ม section) */
  background?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`${STACK_BASE} ${z} bg-background dark:bg-slate-950 border-t ${borderClass} shadow-[0_-20px_50px_rgba(0,0,0,0.35)]`}
    >
      {background}
      {icon}
      <div className="relative stack:h-full stack:overflow-clip py-10 stack:pt-6 stack:pb-6 px-3 sm:px-6 md:px-8 flex flex-col">
        {/* ชิดด้านบน: การ์ดหัวข้ออยู่บนสุดของ section */}
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </div>
    </section>
  );
}

/** grain บางๆ ให้ gradient ดูนุ่มแบบภาพพิมพ์ (SVG noise ฝังในหน้า ไม่ต้องโหลดไฟล์) */
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * พื้นหลัง abstract แบบ mesh gradient โทนสถาบัน (ม่วง/คราม + ชมพู ฟ้า ทอง แต้มเล็กน้อย)
 * ใช้ก้อนสีเบลอซ้อนกัน + คลื่นสี 1 เส้น + grain — สีอ่อน ไม่แย่งเนื้อหา
 */
function AbstractMeshBackground() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {/* สีพื้น */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-950 dark:via-purple-950/50 dark:to-slate-950" />

      {/* ก้อนสีเบลอ (วางชิดขอบ ให้โผล่รอบชั้นหนังสือ) */}
      <div className="absolute -top-[30%] -left-[12%] size-[44rem] rounded-full bg-purple-400/45 dark:bg-purple-600/25 blur-[100px]" />
      <div className="absolute -top-[20%] right-[-10%] size-[36rem] rounded-full bg-fuchsia-300/45 dark:bg-fuchsia-600/15 blur-[100px]" />
      <div className="absolute -bottom-[35%] left-[10%] size-[42rem] rounded-full bg-sky-300/45 dark:bg-indigo-500/20 blur-[110px]" />
      <div className="absolute -bottom-[15%] right-[5%] size-[26rem] rounded-full bg-amber-200/50 dark:bg-amber-400/10 blur-[90px]" />

      {/* คลื่นสีแนวทแยง (คล้ายภาพตัวอย่าง) */}
      <svg
        className="absolute left-1/2 top-1/2 w-[140%] h-[90%] -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] opacity-60 dark:opacity-30 blur-2xl"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="continue-mesh-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="35%" stopColor="#818cf8" />
            <stop offset="65%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#f0abfc" />
          </linearGradient>
        </defs>
        <path
          d="M0,330 C220,190 430,480 720,310 C1010,140 1190,370 1440,230 L1440,400 C1180,540 980,300 720,460 C450,620 230,350 0,470 Z"
          fill="url(#continue-mesh-wave)"
        />
      </svg>
      {/* เส้นคลื่นคมๆ ซ้อนอีกชั้น ให้รู้สึกเป็นของเหลว */}
      <svg
        className="absolute left-1/2 top-1/2 w-[140%] h-[90%] -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] opacity-35 dark:opacity-20 blur-sm"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0,400 C220,260 430,550 720,380 C1010,210 1190,440 1440,300"
          fill="none"
          stroke="url(#continue-mesh-wave)"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>

      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_BG }}
      />
    </div>
  );
}

/**
 * พื้นหลังส่วนบุ๊กมาร์ก: โทนอุ่น (ทอง/พีช/ชมพูอมม่วง) รับกับริบบิ้นสีทอง
 * ลายเส้นโค้งเหมือนริบบิ้นผ้าไหม เอียงสวนทางกับ section ก่อนหน้า
 */
function RibbonMeshBackground() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <div className="absolute inset-0 bg-gradient-to-bl from-amber-50 via-white to-purple-50 dark:from-slate-950 dark:via-amber-950/20 dark:to-purple-950/40" />

      <div className="absolute -top-[25%] -right-[10%] size-[40rem] rounded-full bg-amber-300/45 dark:bg-amber-500/15 blur-[100px]" />
      <div className="absolute top-[20%] -left-[15%] size-[34rem] rounded-full bg-rose-300/35 dark:bg-rose-500/10 blur-[100px]" />
      <div className="absolute -bottom-[35%] right-[15%] size-[44rem] rounded-full bg-purple-300/45 dark:bg-purple-600/20 blur-[110px]" />
      <div className="absolute -bottom-[20%] -left-[5%] size-[26rem] rounded-full bg-orange-200/45 dark:bg-orange-500/10 blur-[90px]" />

      {/* ริบบิ้น 2 เส้นพันกัน */}
      <svg
        className="absolute left-1/2 top-1/2 w-[140%] h-[95%] -translate-x-1/2 -translate-y-1/2 rotate-[12deg] opacity-55 dark:opacity-25 blur-xl"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="bookmark-ribbon-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="50%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#d8b4fe" />
          </linearGradient>
          <linearGradient id="bookmark-ribbon-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        <path
          d="M0,250 C300,120 520,420 760,300 C1000,180 1200,330 1440,200 L1440,300 C1200,430 1000,280 760,400 C520,520 300,220 0,350 Z"
          fill="url(#bookmark-ribbon-a)"
        />
        <path
          d="M0,420 C260,520 480,250 760,380 C1040,510 1220,300 1440,380 L1440,450 C1220,370 1040,580 760,450 C480,320 260,590 0,490 Z"
          fill="url(#bookmark-ribbon-b)"
          opacity="0.8"
        />
      </svg>

      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_BG }}
      />
    </div>
  );
}

/**
 * พื้นหลังชั้นหนังสือ: โทนเย็น (คราม/ม่วง/ฟ้าอมเขียว) แถบแสงแนวตั้งแบบแสงเหนือ (aurora)
 */
function AuroraMeshBackground() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950" />

      {/* แถบแสง aurora (วงรีแนวตั้ง เอียงต่างกันเล็กน้อย) */}
      <div className="absolute -top-[20%] left-[2%] h-[120%] w-[18rem] -rotate-[18deg] rounded-full bg-gradient-to-b from-violet-400/50 via-indigo-300/35 to-transparent dark:from-violet-600/30 dark:via-indigo-600/15 blur-[70px]" />
      <div className="absolute -top-[30%] left-[30%] h-[110%] w-[14rem] -rotate-[8deg] rounded-full bg-gradient-to-b from-cyan-300/45 via-sky-300/25 to-transparent dark:from-cyan-500/20 dark:via-sky-600/10 blur-[70px]" />
      <div className="absolute -top-[25%] right-[22%] h-[115%] w-[16rem] rotate-[10deg] rounded-full bg-gradient-to-b from-fuchsia-300/40 via-purple-300/30 to-transparent dark:from-fuchsia-600/20 dark:via-purple-600/15 blur-[70px]" />
      <div className="absolute -top-[15%] -right-[4%] h-[120%] w-[18rem] rotate-[20deg] rounded-full bg-gradient-to-b from-indigo-400/45 via-violet-300/30 to-transparent dark:from-indigo-600/25 dark:via-violet-600/15 blur-[70px]" />

      {/* แสงสะท้อนบนพื้น (ใต้ชั้นวาง) */}
      <div className="absolute -bottom-[30%] left-1/2 -translate-x-1/2 h-[24rem] w-[70rem] rounded-[100%] bg-purple-300/40 dark:bg-purple-700/20 blur-[100px]" />

      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_BG }}
      />
    </div>
  );
}

const SECTION_COUNT = 4;

/** ลำดับ section สำหรับตัวบอกตำแหน่ง (id = marker ก่อนแต่ละ section, สุดท้ายคือ footer ใน layout) */
const HOME_STEPS: HomeStep[] = [
  { id: "home-hero", label: "หน้าแรก", icon: "home" },
  { id: "home-continue", label: "อ่านค้างไว้", icon: "continue" },
  { id: "home-bookmarks", label: "บุ๊กมาร์ก", icon: "bookmark" },
  { id: "home-shelf", label: "ชั้นหนังสือ", icon: "shelf" },
  { id: "site-footer", label: "ติดต่อเรา", icon: "contact" },
];

/** จุดอ้างอิงตำแหน่ง section (สูง 0px อยู่ใน flow ปกติ ไม่ sticky จึงวัดตำแหน่งที่เลื่อนถึงได้ถูก) */
function StepMarker({ id }: { id: string }) {
  return <div id={id} aria-hidden className="h-0 scroll-mt-16" />;
}

/** ภาพพื้นหลัง hero (ภาพเดียวกับลายน้ำใน layout) */
const HERO_BG_IMAGE =
  "https://admin.bhumjaithai.com/wp-content/uploads/2025/03/001_Master-file_BJT-Template_Artboard-5-copy_0-2.jpg";

export default async function HomePage() {
  // 24 เล่ม = ชั้นละ 4 × 2 ชั้นต่อหน้า × 3 หน้า บน Interactive Bookshelf
  const { items } = await listPublishedBooks({ take: 24 });
  const suggestions = items.slice(0, 4);

  return (
    // ไม่มี scroll container ของตัวเอง: ใช้ scroll ของหน้า (window) ตัวเดียวร่วมกับ layout
    // → footer ต่อท้ายตามธรรมชาติ ไม่เกิด scroll ซ้อน/ติด
    <div className="relative w-full">
      {/*
        Snap แบบ native ของเบราว์เซอร์ (ไม่ดัก wheel ด้วย JS แล้ว → ทัชแพดทำงานปกติ)
        - เปิดเฉพาะจอ `stack` และเฉพาะหน้านี้ (style หายไปเมื่อออกจากหน้า)
        - scroll-padding-top = ความสูง header (4rem)
        - snap-stop: always = เลื่อนแรงแค่ไหนก็หยุดทีละ section
        - ใช้ anchor แยก (ไม่ใช่ตัว section) เพราะ section เป็น sticky ซึ่งตีกับ scroll-snap
      */}
      <style>{`@media ${STACK_MEDIA}{html{scroll-snap-type:y mandatory;scroll-padding-top:4rem}}`}</style>
      {Array.from({ length: SECTION_COUNT }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="hidden stack:block absolute inset-x-0 snap-start snap-always pointer-events-none"
          style={{
            top: `calc(${i} * (100dvh - 4rem))`,
            height: "calc(100dvh - 4rem)",
          }}
        />
      ))}

      <HomeStepper steps={HOME_STEPS} />

      <StepMarker id="home-hero" />
      {/* Section 1: Hero (ถูกล็อกไว้ แล้ว section 2 เลื่อนมาทับ) */}
      <section
        className={`${STACK_BASE} min-h-[calc(100dvh-4rem)] z-0 overflow-clip bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 dark:from-purple-950/90 dark:via-purple-900/80 dark:to-indigo-950/90 text-white flex flex-col justify-between items-center py-12`}
      >
        {/* ภาพพื้นหลังแบบจาง: luminosity = คงรายละเอียดภาพแต่รับโทนสีม่วงจากพื้นหลัง */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_BG_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover opacity-15 mix-blend-luminosity pointer-events-none select-none"
        />

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

      <StepMarker id="home-continue" />
      {/* Section 2: หนังสือที่อ่านค้างไว้ */}
      <StackSection
        z="z-10"
        borderClass="border-purple-500/20 dark:border-purple-400/20"
        icon={<ScrollIndicatorIcon />}
        background={<AbstractMeshBackground />}
      >
        <ContinueReadingSection suggestions={suggestions} />
      </StackSection>

      <StepMarker id="home-bookmarks" />
      {/* Section 3: บุ๊กมาร์ก */}
      <StackSection
        z="z-20"
        borderClass="border-border/80"
        background={<RibbonMeshBackground />}
      >
        <BookmarkSection />
      </StackSection>

      <StepMarker id="home-shelf" />
      {/* Section 4: Interactive Bookshelf */}
      <StackSection
        z="z-30"
        borderClass="border-border/80"
        background={<AuroraMeshBackground />}
      >
        <InteractiveBookshelf books={items} />
      </StackSection>
    </div>
  );
}
