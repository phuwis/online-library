import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-foreground relative flex flex-col font-sans">
      {/* Background Watermark Image */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <img
          src="https://admin.bhumjaithai.com/wp-content/uploads/2025/03/001_Master-file_BJT-Template_Artboard-5-copy_0-2.jpg"
          alt="ตราสัญลักษณ์ฉากหลัง"
          className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.08] select-none"
        />
      </div>

      {/* Global Public Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Agency Title */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-primary/5 p-1 border border-primary/10 shrink-0 shadow-sm">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8JlhtBJqp7gVwX4qm2t5OGY8xHw1TcPrJYtbIIMC3kQ3rzBkd67svfEP5&s=10"
                alt="ตราสัญลักษณ์สำนักงาน"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm md:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                สถาบันดำรงราชานุภาพ สำนักงานปลัดกระทรวงมหาดไทย
              </span>
              <span className="text-[11px] text-muted-foreground">
                กลุ่มงานพัฒนาและบริหารจัดการความรู้ (KM)
              </span>
            </div>
          </Link>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-3">
            {/* Nav Menu Items */}
            <nav className="flex items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs font-medium"
              >
                <Link href="/books">หนังสือทั้งหมด</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs font-medium"
              >
                <Link href="/dashboard">จัดการระบบ</Link>
              </Button>
            </nav>

            <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-muted-foreground relative z-10 bg-background/50 backdrop-blur-sm">
        © {new Date().getFullYear()} สถาบันดำรงราชานุภาพ
        สำนักงานปลัดกระทรวงมหาดไทย. All rights reserved.
      </footer>
    </div>
  );
}
