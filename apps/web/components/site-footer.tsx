import Link from "next/link";
import {
  ArrowUp,
  Clock,
  ExternalLink,
  Facebook,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Youtube,
} from "lucide-react";
import { BookshelfStrip } from "@/components/bookshelf-strip";
import { FooterFocusEffect } from "@/components/footer-focus-effect";

/**
 * ข้อมูลทั้งหมดใน footer (แก้ที่นี่ที่เดียว)
 * TODO: ข้อมูลติดต่อ / ลิงก์โซเชียล / ลิงก์นโยบาย ด้านล่างเป็นข้อมูลตัวอย่าง (mock)
 *       ต้องตรวจสอบและแทนด้วยข้อมูลจริงของหน่วยงานก่อนเปิดใช้งาน
 */
const FOOTER_CONTENT = {
  name: "ห้องสมุดกระทรวงมหาดไทย",
  org: "สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย",
  logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8JlhtBJqp7gVwX4qm2t5OGY8xHw1TcPrJYtbIIMC3kQ3rzBkd67svfEP5&s=10",
  description:
    "คลังความรู้ดิจิทัลด้านการปกครอง การบริหารงานเชิงพื้นที่ และเอกสารวิชาการของกระทรวงมหาดไทย เปิดให้ข้าราชการและประชาชนอ่านออนไลน์ได้ทุกที่ทุกเวลา",
  contact: {
    address: "สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย (ใส่ที่อยู่จริง)",
    phone: "0 2xxx xxxx",
    phoneHref: "tel:02xxxxxxx",
    email: "library@example.go.th",
    hours: "จันทร์–ศุกร์ 08.30–16.30 น. (เว้นวันหยุดราชการ)",
  },
  socials: [
    { label: "Facebook", href: "#", icon: Facebook },
    { label: "YouTube", href: "#", icon: Youtube },
  ],
  quickLinks: [
    { label: "หน้าแรก", href: "/" },
    { label: "หนังสือทั้งหมด", href: "/books" },
    { label: "บุ๊กมาร์กของฉัน", href: "/books?category=bookmarks" },
    { label: "เกี่ยวกับสถาบัน", href: "/about" },
  ],
  relatedLinks: [
    { label: "กระทรวงมหาดไทย", href: "https://www.moi.go.th" },
    { label: "สำนักงานปลัดกระทรวงมหาดไทย", href: "#" },
    { label: "สถาบันดำรงราชานุภาพ", href: "#" },
  ],
  policies: [
    { label: "นโยบายเว็บไซต์", href: "#" },
    { label: "นโยบายคุ้มครองข้อมูลส่วนบุคคล", href: "#" },
    { label: "นโยบายการรักษาความมั่นคงปลอดภัย", href: "#" },
  ],
  map: {
    title: "แผนที่ วิทยาลัยมหาดไทย",
    /** ให้ Google Maps ค้นจากชื่อสถานที่ (ไม่ต้องใช้ API key) — เปลี่ยนเป็นพิกัดได้ เช่น "13.75,100.50" */
    query: "วิทยาลัยมหาดไทย",
  },
};

export function SiteFooter() {
  const mapQuery = encodeURIComponent(FOOTER_CONTENT.map.query);
  const mapEmbed = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;
  const mapOpen = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapDirections = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
  const buddhistYear = new Date().getFullYear() + 543;

  return (
    <footer
      id="site-footer"
      className="snap-end relative z-20 -mt-8 min-h-[50dvh] overflow-hidden rounded-t-[2rem] border-t border-purple-400/30 bg-gradient-to-b from-[#2a0f45] via-[#1c0a30] to-[#12061f] text-purple-100 shadow-[0_-24px_60px_rgba(30,8,60,0.45)]"
    >
      <FooterFocusEffect />

      {/* ตกแต่ง: แสงฟุ้ง + ชั้นหนังสือจางๆ ที่ขอบล่าง */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[10%] size-[32rem] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-[5%] size-[28rem] rounded-full bg-indigo-600/20 blur-[120px]" />
        <BookshelfStrip
          seed={21}
          className="absolute inset-x-0 bottom-0 h-14 w-full opacity-[0.2]"
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 md:px-8 pt-10 pb-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.85fr_1.45fr] lg:gap-10">
          {/* 1) หน่วยงาน */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 rounded-xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FOOTER_CONTENT.logo}
                  alt="ตราสัญลักษณ์"
                  className="size-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white leading-tight">
                  {FOOTER_CONTENT.name}
                </p>
                <p className="text-[11px] text-purple-200/75 leading-snug">
                  {FOOTER_CONTENT.org}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-purple-200/80">
              {FOOTER_CONTENT.description}
            </p>
            <div className="flex items-center gap-2">
              {FOOTER_CONTENT.socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="size-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-purple-100 hover:bg-white/15 hover:text-white transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* 2) ติดต่อเรา */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-white">
              ติดต่อเรา
            </h3>
            <ul className="space-y-2.5 text-sm">
              <ContactRow icon={MapPin}>
                {FOOTER_CONTENT.contact.address}
              </ContactRow>
              <ContactRow icon={Phone}>
                <a
                  href={FOOTER_CONTENT.contact.phoneHref}
                  className="hover:text-white hover:underline"
                >
                  {FOOTER_CONTENT.contact.phone}
                </a>
              </ContactRow>
              <ContactRow icon={Mail}>
                <a
                  href={`mailto:${FOOTER_CONTENT.contact.email}`}
                  className="hover:text-white hover:underline break-all"
                >
                  {FOOTER_CONTENT.contact.email}
                </a>
              </ContactRow>
              <ContactRow icon={Clock}>
                {FOOTER_CONTENT.contact.hours}
              </ContactRow>
            </ul>
          </div>

          {/* 3) เมนูลัด + หน่วยงานที่เกี่ยวข้อง */}
          <div className="space-y-6">
            <FooterColumn title="เมนูลัด">
              {FOOTER_CONTENT.quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="footer-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>
            <FooterColumn title="หน่วยงานที่เกี่ยวข้อง">
              {FOOTER_CONTENT.relatedLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    {l.label}
                    <ExternalLink className="ml-1 inline-block size-3 align-[-1px] opacity-60" />
                  </a>
                </li>
              ))}
            </FooterColumn>
          </div>

          {/* 4) แผนที่ */}
          <div className="space-y-3 md:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-bold tracking-wide text-white">
              {FOOTER_CONTENT.map.title}
            </h3>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/15 bg-purple-950/60 shadow-2xl">
              {/* แสดงระหว่างรอแผนที่โหลด / กรณีโหลดไม่ได้ */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-purple-200/60 text-xs">
                <MapPin className="size-8" />
                กำลังโหลดแผนที่…
              </div>
              <iframe
                title={FOOTER_CONTENT.map.title}
                src={mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="relative size-full border-0 [filter:saturate(0.85)]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={mapOpen}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-purple-950 hover:bg-purple-100 transition-colors"
              >
                <MapPin className="size-3.5" />
                เปิดใน Google Maps
              </a>
              <a
                href={mapDirections}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-purple-100 hover:bg-white/15 transition-colors"
              >
                <Navigation className="size-3.5" />
                นำทาง
              </a>
            </div>
          </div>
        </div>

        {/* แถบล่าง */}
        <div className="mt-8 flex flex-col-reverse gap-4 border-t border-white/10 pt-6 text-xs text-purple-200/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {buddhistYear} {FOOTER_CONTENT.org} สงวนลิขสิทธิ์
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {FOOTER_CONTENT.policies.map((p) => (
              <a
                key={p.label}
                href={p.href}
                className="hover:text-white hover:underline"
              >
                {p.label}
              </a>
            ))}
            <a
              href="#"
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-purple-100 hover:bg-white/15"
            >
              <ArrowUp className="size-3.5" />
              กลับด้านบน
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold tracking-wide text-white">{title}</h3>
      <ul className="space-y-2 text-sm text-purple-200/80 [&_.footer-link]:transition-colors [&_.footer-link:hover]:text-white">
        {children}
      </ul>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5 text-purple-200/85">
      <Icon className="mt-0.5 size-4 shrink-0 text-amber-300/90" />
      <span>{children}</span>
    </li>
  );
}
