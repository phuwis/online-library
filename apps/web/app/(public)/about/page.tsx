"use client";

import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import {
  ArrowLeft,
  GraduationCap,
  History,
  Landmark,
  ShieldCheck,
  Users,
  BookOpen,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ABOUT_CONTENT = {
  hero: {
    badge: "ประวัติและพันธกิจองค์กร • สถาบันดำรงราชานุภาพ",
    titlePrefix: "เกียรติภูมิแห่งการปกครอง",
    titleHighlight: "เพื่อประโยชน์สุขของประชาชน",
    description:
      "สถาบันหลักในการพัฒนาสมรรถนะบุคลากร สืบทอดเจตนารมณ์ทางปัญญา และขับเคลื่อนยุทธศาสตร์การบริหารงานเชิงพื้นที่ตามรอยพระปณิธาน",
  },
  sections: {
    history: {
      badge: "ประวัติความเป็นมา",
      title: "สืบสานพระปณิธาน สมเด็จพระเจ้าบรมวงศ์เธอ กรมพระยาดำรงราชานุภาพ",
      description:
        "สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย จัดตั้งขึ้นเพื่อให้เป็นศูนย์กลางการเรียนรู้ การวิจัย และพัฒนาองค์ความรู้ด้านการปกครองท้องถิ่น การบริหารราชการแผ่นดิน และการบำบัดทุกข์บำรุงสุขแก่ประชาชนตามรากเหง้าประวัติศาสตร์อันทรงคุณค่า",
      highlights: [
        "ศูนย์รวมตำรา คู่มือระเบียบปฏิบัติ และเอกสารประวัติศาสตร์การปกครองไทย",
        "สืบสานแนวคิดการบริหารจัดการเชิงพื้นที่และการพัฒนาท้องถิ่นอย่างยั่งยืน",
        "ส่งเสริมการเรียนรู้ตลอดชีวิตสำหรับบุคลากรภาครัฐและผู้สนใจทั่วไป",
      ],
      caption: "สมเด็จพระเจ้าบรมวงศ์เธอ กรมพระยาดำรงราชานุภาพ",
    },
    library: {
      badge: "แหล่งเรียนรู้ทรงคุณค่า",
      title: "ห้องสมุดกระทรวงมหาดไทยและคลังปัญญาดิจิทัล",
      description:
        "พื้นที่รวบรวมหนังสือหายาก เอกสารวิชาการ รายงานผลการศึกษา และสื่อดิจิทัลอัจฉริยะ ที่เปิดโอกาสให้ข้าราชการและประชาชนสามารถเข้าถึงแหล่งข้อมูลเพื่อการค้นคว้าและอ้างอิงได้อย่างไร้ขีดจำกัด",
      highlights: [
        "บริการระบบสืบค้นและคลังหนังสืออิเล็กทรอนิกส์ (E-Library)",
        "รวบรวมกฎหมาย ระเบียบ และคู่มือการปฏิบัติงานที่สำคัญ",
        "บรรยากาศการเรียนรู้ที่ผสมผสานความคลาสสิกและความทันสมัยเข้าด้วยกัน",
      ],
      caption: "ห้องสมุดกระทรวงมหาดไทย",
    },
    college: {
      badge: "สถาบันการศึกษาและพัฒนา",
      title: "วิทยาลัยมหาดไทยและการอบรมบุคลากรเชิงพื้นที่",
      description:
        "ภารกิจหลักในการยกระดับสมรรถนะผู้นำและนักบริหารงานท้องถิ่น ผ่านหลักสูตรฝึกอบรมอันเข้มข้น เพื่อสร้างเครือข่ายความร่วมมือและขับเคลื่อนนโยบายสำคัญสู่การปฏิบัติในระดับพื้นที่อย่างมีประสิทธิภาพ",
      highlights: [
        "หลักสูตรพัฒนาสมรรถนะนักบริหารงานเชิงพื้นที่ (นบท.) และสายงานปกครอง",
        "การสัมมนาแลกเปลี่ยนองค์ความรู้ระหว่างผู้บริหารและนักวิชาการ",
        "มุ่งเน้นการสร้างผู้นำที่มีคุณธรรม จริยธรรม และวิสัยทัศน์กว้างไกล",
      ],
      caption: "การอบรมและพัฒนาบุคลากรโดยวิทยาลัยมหาดไทย",
    },
  },
};

export default function AboutPage() {
  return (
    /* 🌟 ใช้ max-w-6xl mx-auto px-... แบบเดียวกับหน้าแรก เพื่อให้สัดส่วนตรงกันเป๊ะ ไม่ถูกบีบเล็กเกินไป */
    <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-6 sm:py-8 space-y-16 pb-20">
      {/* 🌟 1. Hero Section (สัดส่วนและดีไซน์เดียวกับหน้าแรกในรูปที่ 1) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 dark:from-purple-950/90 dark:via-purple-900/80 dark:to-indigo-950/90 text-white p-6 sm:p-10 md:p-16 shadow-2xl border border-purple-800/40">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs sm:text-sm font-medium border border-white/10">
            <Sparkles className="size-4 text-yellow-400" />
            <span>{ABOUT_CONTENT.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
            {ABOUT_CONTENT.hero.titlePrefix}{" "}
            <span className="text-purple-300">
              {ABOUT_CONTENT.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-purple-100/80 leading-relaxed max-w-2xl">
            {ABOUT_CONTENT.hero.description}
          </p>

          <div className="pt-2">
            <Button
              asChild
              variant="outline"
              size="default"
              className="rounded-xl border-purple-300/60 bg-purple-900/40 text-white hover:bg-purple-800/60 backdrop-blur-md shadow-sm"
            >
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="size-4" />
                <span>กลับสู่หน้าหลักห้องสมุด</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 🌟 2. ส่วนประวัติความเป็นมา (ปรับดีไซน์เป็นการ์ดกว้างเต็มกรอบ max-w-6xl สมดุลสวยงาม) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center bg-card border border-border/80 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl">
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
            <History className="size-4" />{" "}
            {ABOUT_CONTENT.sections.history.badge}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
            {ABOUT_CONTENT.sections.history.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {ABOUT_CONTENT.sections.history.description}
          </p>
          <ul className="space-y-3 text-sm text-foreground/90 font-medium">
            {ABOUT_CONTENT.sections.history.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-primary shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950/30 via-primary/10 to-indigo-950/20 border-2 border-border/80 shadow-inner flex flex-col items-center justify-center p-6 text-center group">
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors" />
          <div className="relative z-10 space-y-3 transform group-hover:scale-105 transition-transform duration-500">
            <div className="size-20 rounded-2xl bg-primary/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-md">
              <Landmark className="size-10 text-primary" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-foreground tracking-wide">
              {ABOUT_CONTENT.sections.history.caption}
            </p>
            <span className="inline-block text-[11px] text-muted-foreground bg-background/80 px-3 py-1 rounded-full border border-border">
              (รองรับการแทรกภาพถ่ายจริงความละเอียดสูง)
            </span>
          </div>
        </div>
      </section>

      {/* 🌟 3. ส่วนห้องสมุดกระทรวงมหาดไทย */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center bg-card border border-border/80 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl">
        <div className="order-2 md:order-1 relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950/30 via-purple-900/10 to-primary/20 border-2 border-border/80 shadow-inner flex flex-col items-center justify-center p-6 text-center group">
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors" />
          <div className="relative z-10 space-y-3 transform group-hover:scale-105 transition-transform duration-500">
            <div className="size-20 rounded-2xl bg-primary/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-md">
              <BookOpen className="size-10 text-primary" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-foreground tracking-wide">
              {ABOUT_CONTENT.sections.library.caption}
            </p>
            <span className="inline-block text-[11px] text-muted-foreground bg-background/80 px-3 py-1 rounded-full border border-border">
              (รองรับการแทรกภาพถ่ายห้องสมุดจริง)
            </span>
          </div>
        </div>

        <div className="order-1 md:order-2 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
            <BookOpen className="size-4" />{" "}
            {ABOUT_CONTENT.sections.library.badge}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
            {ABOUT_CONTENT.sections.library.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {ABOUT_CONTENT.sections.library.description}
          </p>
          <ul className="space-y-3 text-sm text-foreground/90 font-medium">
            {ABOUT_CONTENT.sections.library.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-primary shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 🌟 4. ส่วนวิทยาลัยมหาดไทยและการอบรม */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center bg-card border border-border/80 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl">
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
            <GraduationCap className="size-4" />{" "}
            {ABOUT_CONTENT.sections.college.badge}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
            {ABOUT_CONTENT.sections.college.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {ABOUT_CONTENT.sections.college.description}
          </p>
          <ul className="space-y-3 text-sm text-foreground/90 font-medium">
            {ABOUT_CONTENT.sections.college.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-primary shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-950/30 via-indigo-950/20 to-primary/10 border-2 border-border/80 shadow-inner flex flex-col items-center justify-center p-6 text-center group">
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors" />
          <div className="relative z-10 space-y-3 transform group-hover:scale-105 transition-transform duration-500">
            <div className="size-20 rounded-2xl bg-primary/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-md">
              <Users className="size-10 text-primary" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-foreground tracking-wide">
              {ABOUT_CONTENT.sections.college.caption}
            </p>
            <span className="inline-block text-[11px] text-muted-foreground bg-background/80 px-3 py-1 rounded-full border border-border">
              (รองรับการแทรกภาพถ่ายการอบรมจริง)
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
