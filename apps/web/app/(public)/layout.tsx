import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookshelfStrip } from "@/components/bookshelf-strip";
import { PublicNav } from "@/components/public-nav";
import { SiteFooter } from "@/components/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-foreground relative flex flex-col"
      style={{ fontFamily: '"PrimaryFont", sans-serif' }}
    >
      {/* Background Watermark Image */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <img
          src="https://admin.bhumjaithai.com/wp-content/uploads/2025/03/001_Master-file_BJT-Template_Artboard-5-copy_0-2.jpg"
          alt="ตราสัญลักษณ์ฉากหลัง"
          className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.08] select-none"
        />
      </div>

      {/* Global Public Header Bar */}
      <header className="sticky top-0 z-50 w-full overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-background/80 backdrop-blur-md">
        {/* ชั้นหนังสือเต็มความกว้าง header (จางมาก) */}
        <BookshelfStrip className="pointer-events-none absolute inset-0 size-full opacity-[0.1] dark:opacity-[0.16]" />
        <div className="relative max-w-6xl mx-auto px-3 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink min-w-0"
          >
            <div className="relative size-9 sm:size-10 flex items-center justify-center rounded-lg bg-primary/5 p-1 border border-primary/10 shrink-0 shadow-sm">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8JlhtBJqp7gVwX4qm2t5OGY8xHw1TcPrJYtbIIMC3kQ3rzBkd67svfEP5&s=10"
                alt="ตราสัญลักษณ์สำนักงาน"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight truncate">
                ห้องสมุดกระทรวงมหาดไทย
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground truncate leading-tight">
                สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <PublicNav />
            <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 🌟 ปลดล็อก Main ให้เป็น w-full โดยย้าย Container ไปไว้ที่หน้าเฉพาะแทน */}
      {/* id ใช้กับเอฟเฟกต์เบลอ/จางตอนเลื่อนถึง footer (FooterFocusEffect) */}
      <main id="site-main" className="flex-1 relative z-10 w-full">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
