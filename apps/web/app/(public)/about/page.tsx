import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  GraduationCap,
  History,
  Landmark,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BookshelfStrip } from "@/components/bookshelf-strip";
import { AboutImage, type ImageSlot } from "@/components/about/about-image";
import { Parallax } from "@/components/about/parallax";
import { RevealText } from "@/components/about/reveal-text";
import {
  HistoryTimeline,
  type Milestone,
} from "@/components/about/history-timeline";
import { MissionTrack, type Mission } from "@/components/about/mission-track";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา | ห้องสมุดกระทรวงมหาดไทย",
  description:
    "ประวัติสมเด็จพระเจ้าบรมวงศ์เธอ กรมพระยาดำรงราชานุภาพ สถาบันดำรงราชานุภาพ ห้องสมุดกระทรวงมหาดไทย และภารกิจของเรา",
};

/** ช่องภาพ: ตั้ง src เป็น path ใน public/ เมื่อมีภาพจริง เช่น "/files/about/hero.jpg" */
const img = (
  hint: string,
  icon: ImageSlot["icon"],
  src: string | null = null,
): ImageSlot => ({
  src,
  alt: hint,
  hint,
  icon,
});

/**
 * เนื้อหาทั้งหมดของหน้า (แก้ที่นี่ที่เดียว)
 * - ข้อมูลพระประวัติตรวจสอบกับแหล่งอ้างอิงแล้ว (Britannica, Wikipedia, กระทรวงมหาดไทย, ศิลปวัฒนธรรม)
 * - TODO: ข้อมูลเฉพาะของสถาบัน (ปีจัดตั้ง โครงสร้าง ตัวเลขผลงาน) ให้หน่วยงานตรวจสอบ/เติมก่อนเผยแพร่
 * - TODO: ใส่ภาพจริงที่หน่วยงานมีสิทธิ์เผยแพร่ในช่อง src
 */
const ABOUT_CONTENT = {
  hero: {
    badge: "เกี่ยวกับเรา • สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย",
    titlePrefix: "เกียรติภูมิแห่งการปกครอง",
    titleHighlight: "เพื่อประโยชน์สุขของประชาชน",
    description:
      "สถาบันหลักในการพัฒนาสมรรถนะบุคลากร สืบทอดเจตนารมณ์ทางปัญญา และขับเคลื่อนยุทธศาสตร์การบริหารงานเชิงพื้นที่ตามรอยพระปณิธาน",
    image: img("อาคารกระทรวงมหาดไทย / ห้องสมุด มุมกว้าง", "building"),
    bigYear: "2435",
  },
  intro: {
    eyebrow: "จุดเริ่มต้นของเรา",
    phrases: [
      "ห้องสมุดกระทรวงมหาดไทย",
      "คือคลังความรู้ด้านการปกครอง",
      "ที่สืบสานพระปณิธาน",
      "ของสมเด็จพระเจ้าบรมวงศ์เธอ",
      "กรมพระยาดำรงราชานุภาพ",
      "เสนาบดีกระทรวงมหาดไทยพระองค์แรก",
      "เพื่อส่งต่อความรู้",
      "ถึงข้าราชการและประชาชน",
      "ทุกคน ทุกที่ ทุกเวลา",
    ],
  },
  history: {
    eyebrow: "พระประวัติ",
    title: "สมเด็จพระเจ้าบรมวงศ์เธอ กรมพระยาดำรงราชานุภาพ",
    subtitle: "เสนาบดีกระทรวงมหาดไทยพระองค์แรก และ “บิดาแห่งประวัติศาสตร์ไทย”",
    milestones: [
      {
        year: "พ.ศ. 2405",
        title: "ประสูติ",
        body: "พระองค์เจ้าดิศวรกุมาร ประสูติเมื่อวันที่ 21 มิถุนายน พ.ศ. 2405 เป็นพระราชโอรสในพระบาทสมเด็จพระจอมเกล้าเจ้าอยู่หัว กับเจ้าจอมมารดาชุ่ม",
        image: img("พระรูปช่วงต้นพระชนม์", "crown"),
      },
      {
        year: "ก่อน พ.ศ. 2435",
        title: "บุกเบิกงานการศึกษาของชาติ",
        body: "ทรงรับผิดชอบงานจัดการศึกษา และดำรงตำแหน่งอธิบดีกรมศึกษาธิการ ซึ่งเป็นรากฐานของระบบการศึกษาสมัยใหม่ของไทย ก่อนได้รับแต่งตั้งเป็นเสนาบดีกระทรวงมหาดไทย",
        image: img("โรงเรียน / เอกสารการศึกษายุคแรก", "book"),
      },
      {
        year: "พ.ศ. 2435",
        title: "เสนาบดีกระทรวงมหาดไทยพระองค์แรก",
        body: "ในการปฏิรูปการบริหารราชการแผ่นดินของพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว ทรงได้รับแต่งตั้งเป็นเสนาบดีกระทรวงมหาดไทยเมื่อวันที่ 1 เมษายน พ.ศ. 2435 วันนี้จึงเป็นวันสถาปนากระทรวงมหาดไทย",
        image: img("พระรูปในฐานะเสนาบดี", "landmark"),
      },
      {
        year: "พ.ศ. 2435–2458",
        title: "ปฏิรูปการปกครองหัวเมือง",
        body: "ทรงวางระบบการปกครองแบบมณฑลเทศาภิบาล เสด็จตรวจราชการหัวเมืองด้วยพระองค์เอง และนำไปสู่การยกเลิกการปกครองแบบ “กินเมือง” วางรากฐานการปกครองส่วนภูมิภาคมาจนถึงปัจจุบัน",
        image: img("การเสด็จตรวจราชการหัวเมือง", "map"),
      },
      {
        year: "หลัง พ.ศ. 2458",
        title: "นายกหอพระสมุดวชิรญาณ",
        body: "หลังกราบถวายบังคมลาจากตำแหน่งเสนาบดีในเดือนสิงหาคม พ.ศ. 2458 ทรงได้รับแต่งตั้งเป็นนายกหอพระสมุดวชิรญาณในรัชกาลที่ 6 และทรงอุทิศพระองค์ให้งานค้นคว้าและนิพนธ์ทางประวัติศาสตร์",
        image: img("หอพระสมุด / หนังสือพระนิพนธ์", "scroll"),
      },
      {
        year: "พ.ศ. 2486",
        title: "สิ้นพระชนม์ — วันดำรงราชานุภาพ",
        body: "สิ้นพระชนม์เมื่อวันที่ 1 ธันวาคม พ.ศ. 2486 คณะรัฐมนตรีมีมติเมื่อ 27 พฤศจิกายน พ.ศ. 2544 ให้วันที่ 1 ธันวาคมของทุกปีเป็น “วันดำรงราชานุภาพ”",
        image: img("พระอนุสาวรีย์ ณ กระทรวงมหาดไทย", "landmark"),
      },
      {
        year: "พ.ศ. 2505",
        title: "บุคคลสำคัญของโลก",
        body: "ในวาระครบ 100 ปีชาตกาล องค์การยูเนสโกถวายพระเกียรติยกย่องเป็นบุคคลสำคัญของโลก นับเป็นคนไทยพระองค์แรกที่ได้รับการยกย่องนี้",
        image: img("พิธีเฉลิมพระเกียรติ / เอกสารยูเนสโก", "crown"),
      },
    ] satisfies Milestone[],
  },
  legacy: {
    title: "บิดาแห่งประวัติศาสตร์ไทย",
    body: "ได้รับการยกย่องว่าทรงวางรากฐานทั้งงานประวัติศาสตร์ ระบบการศึกษา ระบบสาธารณสุข และการปกครองส่วนภูมิภาคของไทย",
    image: img("หนังสือพระนิพนธ์ / เอกสารประวัติศาสตร์", "scroll"),
  },
  office: {
    eyebrow: "สำนักงานของเรา",
    title: "จากพระปณิธาน สู่สถาบันแห่งการเรียนรู้",
    rows: [
      {
        icon: History,
        badge: "สถาบันดำรงราชานุภาพ",
        title: "ศูนย์กลางการเรียนรู้และพัฒนาองค์ความรู้ด้านการปกครอง",
        description:
          "สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย จัดตั้งขึ้นเพื่อเป็นศูนย์กลางการเรียนรู้ การวิจัย และพัฒนาองค์ความรู้ด้านการปกครองท้องถิ่น การบริหารราชการแผ่นดิน และการบำบัดทุกข์บำรุงสุขแก่ประชาชนตามรากเหง้าประวัติศาสตร์อันทรงคุณค่า",
        highlights: [
          "ศูนย์รวมตำรา คู่มือระเบียบปฏิบัติ และเอกสารประวัติศาสตร์การปกครองไทย",
          "สืบสานแนวคิดการบริหารจัดการเชิงพื้นที่และการพัฒนาท้องถิ่นอย่างยั่งยืน",
          "ส่งเสริมการเรียนรู้ตลอดชีวิตสำหรับบุคลากรภาครัฐและผู้สนใจทั่วไป",
        ],
        images: [
          img("อาคารสถาบันดำรงราชานุภาพ", "building"),
          img("บรรยากาศการทำงาน", "people"),
        ],
      },
      {
        icon: BookOpen,
        badge: "ห้องสมุดกระทรวงมหาดไทย",
        title: "ห้องสมุดกระทรวงมหาดไทยและคลังปัญญาดิจิทัล",
        description:
          "พื้นที่รวบรวมหนังสือหายาก เอกสารวิชาการ รายงานผลการศึกษา และสื่อดิจิทัล ที่เปิดโอกาสให้ข้าราชการและประชาชนเข้าถึงแหล่งข้อมูลเพื่อการค้นคว้าและอ้างอิงได้อย่างไร้ขีดจำกัด",
        highlights: [
          "บริการระบบสืบค้นและคลังหนังสืออิเล็กทรอนิกส์ (E-Library)",
          "รวบรวมกฎหมาย ระเบียบ และคู่มือการปฏิบัติงานที่สำคัญ",
          "บรรยากาศการเรียนรู้ที่ผสมผสานความคลาสสิกและความทันสมัย",
        ],
        images: [
          img("ห้องอ่านหนังสือ / ชั้นหนังสือ", "library"),
          img("หนังสือหายาก", "book"),
        ],
      },
      {
        icon: GraduationCap,
        badge: "วิทยาลัยมหาดไทย",
        title: "วิทยาลัยมหาดไทยและการอบรมบุคลากรเชิงพื้นที่",
        description:
          "ยกระดับสมรรถนะผู้นำและนักบริหารงานท้องถิ่น ผ่านหลักสูตรฝึกอบรมที่เข้มข้น เพื่อสร้างเครือข่ายความร่วมมือและขับเคลื่อนนโยบายสำคัญสู่การปฏิบัติในระดับพื้นที่อย่างมีประสิทธิภาพ",
        highlights: [
          "หลักสูตรพัฒนาสมรรถนะนักบริหารงานเชิงพื้นที่ (นบท.) และสายงานปกครอง",
          "การสัมมนาแลกเปลี่ยนองค์ความรู้ระหว่างผู้บริหารและนักวิชาการ",
          "มุ่งสร้างผู้นำที่มีคุณธรรม จริยธรรม และวิสัยทัศน์กว้างไกล",
        ],
        images: [
          img("ห้องเรียน / การอบรม", "college"),
          img("ผู้เข้ารับการอบรม", "people"),
        ],
      },
    ],
  },
  missions: {
    eyebrow: "ข้อมูลการทำงาน",
    title: "ภารกิจของเรา",
    items: [
      {
        title: "พัฒนาสมรรถนะบุคลากร",
        body: "ออกแบบและจัดหลักสูตรฝึกอบรมสำหรับข้าราชการและผู้บริหารของกระทรวงมหาดไทย เพื่อเตรียมผู้นำที่พร้อมทำงานในพื้นที่",
        points: [
          "หลักสูตรนักบริหารงานเชิงพื้นที่ (นบท.)",
          "หลักสูตรสายงานปกครองและผู้บริหารระดับสูง",
          "การสัมมนาและบรรยายพิเศษ",
        ],
        image: img("การฝึกอบรม", "college"),
      },
      {
        title: "ศึกษา วิจัย และจัดการความรู้",
        body: "รวบรวม วิเคราะห์ และต่อยอดองค์ความรู้ด้านการปกครองและการพัฒนาท้องถิ่น ให้นำไปใช้ได้จริงในการทำงาน",
        points: [
          "รายงานผลการศึกษาและสรุปสาระสำคัญการบรรยาย",
          "การจัดการความรู้ (KM) ขององค์กร",
          "เอกสารวิชาการด้านการบริหารเชิงพื้นที่",
        ],
        image: img("งานวิจัย / เอกสารวิชาการ", "scroll"),
      },
      {
        title: "ห้องสมุดและคลังปัญญาดิจิทัล",
        body: "ให้บริการหนังสือ ตำรา และเอกสารสำคัญทั้งในรูปเล่มและดิจิทัล เปิดให้อ่านออนไลน์ได้ทุกที่ทุกเวลา",
        points: [
          "อ่านหนังสือออนไลน์ ระบบจำหน้าที่อ่านค้างไว้",
          "บุ๊กมาร์กหนังสือที่สนใจไว้อ่านภายหลัง",
          "จัดหมวดหมู่ตามระบบทศนิยมดิวอี้",
        ],
        image: img("ห้องสมุดดิจิทัล", "library"),
      },
      {
        title: "สืบสานพระปณิธาน",
        body: "เผยแพร่พระประวัติและพระกรณียกิจของสมเด็จพระเจ้าบรมวงศ์เธอ กรมพระยาดำรงราชานุภาพ และประวัติศาสตร์การปกครองไทย",
        points: [
          "นิทรรศการและกิจกรรมวันดำรงราชานุภาพ (1 ธันวาคม)",
          "รวบรวมเอกสารประวัติศาสตร์การปกครอง",
          "สร้างแรงบันดาลใจแก่ข้าราชการรุ่นใหม่",
        ],
        image: img("นิทรรศการพระประวัติ", "crown"),
      },
    ] satisfies Mission[],
  },
  howTo: {
    eyebrow: "บริการของห้องสมุด",
    title: "ใช้บริการห้องสมุดออนไลน์ใน 4 ขั้นตอน",
    steps: [
      {
        icon: Search,
        title: "ค้นหา",
        body: "ค้นจากชื่อหนังสือ ผู้แต่ง หรือเลือกตามหมวดหมู่ในหน้าหนังสือทั้งหมด",
      },
      {
        icon: BookOpen,
        title: "ดูรายละเอียด",
        body: "อ่านเรื่องย่อ หมวดหมู่ และข้อมูลหนังสือก่อนเริ่มอ่าน",
      },
      {
        icon: BookMarked,
        title: "บุ๊กมาร์ก",
        body: "กดริบบิ้นเพื่อเก็บเล่มที่สนใจไว้บนชั้นหนังสือเล่มโปรด",
      },
      {
        icon: History,
        title: "อ่านต่อได้ทุกเมื่อ",
        body: "ระบบจำหน้าที่อ่านล่าสุด กลับมาอ่านต่อได้จากหน้าแรก",
      },
    ],
  },
  cta: {
    title: "เริ่มต้นค้นคว้ากับคลังความรู้ของเรา",
    body: "หนังสือ ตำรา และเอกสารวิชาการด้านการปกครอง พร้อมให้อ่านออนไลน์แล้ววันนี้",
  },
};

export default function AboutPage() {
  const c = ABOUT_CONTENT;

  return (
    <div className="overflow-x-clip">
      {/* ───────── 1) Hero: หลายชั้นเคลื่อนที่ต่างความเร็ว ───────── */}
      <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden bg-[#1a0830] text-white">
        {/* ชั้นที่ 1: ภาพพื้นหลัง (ช้าที่สุด) */}
        <Parallax
          speed={0.35}
          scale={0.12}
          className="absolute inset-0 -z-10"
          innerClassName="size-full"
        >
          <AboutImage
            slot={c.hero.image}
            className="size-full opacity-60"
            showHint={false}
            priority
            sizes="100vw"
          />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1a0830] via-[#1a0830]/85 to-[#1a0830]/30" />

        {/* ชั้นที่ 2: ปี พ.ศ. ตัวใหญ่แบบเส้นขอบ */}
        <Parallax
          speed={0.15}
          className="pointer-events-none absolute -right-8 top-1/2 -z-10 -translate-y-1/2 select-none"
        >
          <span className="block text-[clamp(8rem,24vw,22rem)] font-black leading-none tracking-tighter text-transparent [-webkit-text-stroke:2px_rgba(251,191,36,0.22)]">
            {c.hero.bigYear}
          </span>
        </Parallax>

        {/* ชั้นที่ 3: ชั้นหนังสือด้านล่าง (เร็วกว่า) */}
        <Parallax
          speed={-0.08}
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10"
        >
          <BookshelfStrip seed={33} className="h-24 w-full opacity-40" />
        </Parallax>

        {/* ชั้นหน้า: เนื้อหา (ลอยขึ้นและจางเมื่อเลื่อน) */}
        <Parallax
          speed={0.25}
          fade
          className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:px-8"
        >
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-purple-100 backdrop-blur-md sm:text-sm">
              <Sparkles className="size-4 text-amber-300" />
              {c.hero.badge}
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl">
              {c.hero.titlePrefix}
              <span className="mt-2 block bg-gradient-to-r from-amber-200 via-amber-300 to-purple-200 bg-clip-text text-transparent">
                {c.hero.titleHighlight}
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-purple-100/85 sm:text-lg">
              {c.hero.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#history"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-purple-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-300"
              >
                อ่านพระประวัติ
                <ArrowDown className="size-4" />
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
              >
                <ArrowLeft className="size-4" />
                กลับสู่หน้าหลักห้องสมุด
              </Link>
            </div>
          </div>
        </Parallax>

        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-purple-200/70">
          <ArrowDown className="size-5 animate-bounce" />
        </div>
      </section>

      {/* ───────── 2) ข้อความเปิดเรื่อง: สว่างขึ้นทีละวลี ───────── */}
      <section className="relative overflow-hidden bg-background py-24 sm:py-32">
        <Parallax
          speed={0.2}
          className="pointer-events-none absolute -left-24 top-10 -z-0"
        >
          <div className="size-80 rounded-full bg-purple-400/20 blur-[100px]" />
        </Parallax>
        <Parallax
          speed={-0.15}
          className="pointer-events-none absolute -right-20 bottom-0"
        >
          <div className="size-72 rounded-full bg-amber-300/25 blur-[100px]" />
        </Parallax>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
          <p className="mb-6 text-sm font-bold tracking-wide text-amber-600 dark:text-amber-300">
            {c.intro.eyebrow}
          </p>
          <RevealText
            phrases={c.intro.phrases}
            className="text-3xl font-bold leading-[1.45] tracking-tight text-foreground sm:text-5xl sm:leading-[1.35]"
          />
        </div>
      </section>

      {/* ───────── 3) พระประวัติ: ภาพค้าง + ไทม์ไลน์ ───────── */}
      <section
        id="history"
        className="relative scroll-mt-16 bg-gradient-to-b from-[#1a0830] via-[#22093d] to-[#1a0830] py-20 text-white sm:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #e9d5ff 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="mb-12 max-w-3xl space-y-3 lg:mb-4">
            <p className="text-sm font-bold tracking-wide text-amber-300">
              {c.history.eyebrow}
            </p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {c.history.title}
            </h2>
            <p className="text-base text-purple-100/75 sm:text-lg">
              {c.history.subtitle}
            </p>
          </div>
          <HistoryTimeline milestones={c.history.milestones} />
        </div>
      </section>

      {/* ───────── 4) แถบมรดก: ภาพเต็มจอเคลื่อนช้า + ข้อความ ───────── */}
      <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden text-white">
        <Parallax
          speed={0.45}
          scale={0.15}
          className="absolute inset-0 -z-10"
          innerClassName="size-full"
        >
          <AboutImage
            slot={c.legacy.image}
            className="size-full"
            showHint={false}
            sizes="100vw"
          />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1a0830] via-[#1a0830]/70 to-[#1a0830]/40" />
        <Parallax
          speed={-0.05}
          className="mx-auto w-full max-w-4xl px-4 text-center sm:px-6"
        >
          <Landmark
            className="mx-auto mb-6 size-10 text-amber-300"
            strokeWidth={1.4}
          />
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            “{c.legacy.title}”
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-purple-100/85 sm:text-xl">
            {c.legacy.body}
          </p>
        </Parallax>
      </section>

      {/* ───────── 5) สำนักงานของเรา: ภาพซ้อน 2 ชั้นเคลื่อนต่างความเร็ว ───────── */}
      <section className="relative bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-6xl space-y-24 px-4 sm:px-6 md:px-8 sm:space-y-32">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-bold tracking-wide text-amber-600 dark:text-amber-300">
              {c.office.eyebrow}
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {c.office.title}
            </h2>
          </div>

          {c.office.rows.map((row, i) => {
            const reverse = i % 2 === 1;
            const Icon = row.icon;
            return (
              <article
                key={row.badge}
                className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
              >
                {/* ภาพซ้อน */}
                <div
                  className={`relative h-[22rem] sm:h-[28rem] ${reverse ? "lg:order-2" : ""}`}
                >
                  <Parallax
                    speed={0.08}
                    className={`absolute top-0 w-[80%] ${reverse ? "right-0" : "left-0"}`}
                  >
                    <AboutImage
                      slot={row.images[0]!}
                      className="aspect-[4/3] rounded-[2rem] border border-border/60 shadow-2xl"
                    />
                  </Parallax>
                  <Parallax
                    speed={-0.14}
                    className={`absolute bottom-0 w-[48%] ${reverse ? "left-0" : "right-0"}`}
                  >
                    <AboutImage
                      slot={row.images[1]!}
                      className="aspect-square rounded-[1.75rem] border-4 border-background shadow-2xl"
                      sizes="25vw"
                    />
                  </Parallax>
                  <Parallax
                    speed={-0.25}
                    className={`absolute top-6 ${reverse ? "left-2" : "right-2"} z-10`}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 text-xs font-bold text-foreground shadow-xl backdrop-blur-md">
                      <Icon className="size-4 text-purple-600 dark:text-purple-300" />
                      {row.badge}
                    </span>
                  </Parallax>
                </div>

                {/* ข้อความ */}
                <div className={`space-y-5 ${reverse ? "lg:order-1" : ""}`}>
                  <span className="text-6xl font-black leading-none tracking-tighter text-purple-500/15 dark:text-purple-300/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
                    {row.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {row.description}
                  </p>
                  <ul className="space-y-3 text-sm font-medium text-foreground/90">
                    {row.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-purple-600 dark:text-purple-300" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ───────── 6) ข้อมูลการทำงาน: ภารกิจ (ตรึงจอ เลื่อนแนวนอน) ───────── */}
      <section className="relative bg-gradient-to-b from-background via-purple-50/60 to-background py-16 dark:via-purple-950/20 sm:py-20">
        <MissionTrack
          eyebrow={c.missions.eyebrow}
          title={c.missions.title}
          missions={c.missions.items}
        />
      </section>

      {/* ───────── 7) ขั้นตอนใช้บริการ ───────── */}
      <section className="relative bg-background pb-24 pt-8 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="mb-12 max-w-3xl space-y-3">
            <p className="text-sm font-bold tracking-wide text-amber-600 dark:text-amber-300">
              {c.howTo.eyebrow}
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {c.howTo.title}
            </h2>
          </div>
          <div role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.howTo.steps.map((s, i) => {
              const Icon = s.icon;
              return (
                // การ์ดแต่ละใบเคลื่อนต่างความเร็วเล็กน้อย ให้รู้สึกเป็นขั้นบันได
                <Parallax
                  key={s.title}
                  speed={0.04 * (i - 1.5)}
                  className="h-full"
                  innerClassName="h-full"
                >
                  <div
                    role="listitem"
                    className="relative h-full rounded-3xl border border-border/70 bg-card p-6 shadow-lg"
                  >
                    <span className="absolute right-5 top-4 text-5xl font-black text-purple-500/10">
                      {i + 1}
                    </span>
                    <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-bold text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </Parallax>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── 8) ปิดท้าย ───────── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-purple-900 via-[#2a0f45] to-indigo-950 py-24 text-white">
        <Parallax
          speed={0.2}
          className="pointer-events-none absolute inset-x-0 top-0 -z-10"
        >
          <BookshelfStrip seed={51} className="h-20 w-full opacity-30" />
        </Parallax>
        <div className="mx-auto max-w-3xl space-y-6 px-4 pb-10 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            {c.cta.title}
          </h2>
          <p className="text-base text-purple-100/80 sm:text-lg">
            {c.cta.body}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-purple-950 shadow-lg transition-colors hover:bg-amber-300"
            >
              ดูหนังสือทั้งหมด
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-white/15"
            >
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
