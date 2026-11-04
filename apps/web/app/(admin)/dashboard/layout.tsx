import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import { DashboardNav } from "@/components/dashboard-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/login/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen md:grid-cols-[260px_1fr] bg-background text-foreground"
      style={{ fontFamily: '"PrimaryFont", sans-serif' }}
    >
      {/* Sidebar เมนูด้านข้าง */}
      <aside className="flex flex-col gap-6 border-b bg-sidebar p-5 text-sidebar-foreground md:border-b-0 md:border-r border-border/60">
        {/* Logo / Brand */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold tracking-tight text-base group"
          >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8JlhtBJqp7gVwX4qm2t5OGY8xHw1TcPrJYtbIIMC3kQ3rzBkd67svfEP5&s=10"
                alt="ตราสัญลักษณ์สำนักงาน"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span>ห้องสมุดกระทรวงมหาดไทย</span>
          </Link>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <Separator className="opacity-60" />

        {/* Navigation เมนูจัดการ */}
        <div className="flex-1 overflow-y-auto">
          <DashboardNav />
        </div>

        {/* ส่วนท้าย Sidebar (ปุ่มออกจากระบบและสลับธีม) */}
        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between gap-2">
            <form action={logout} className="w-full">
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                ออกจากระบบ
              </Button>
            </form>
            <div className="hidden md:block shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* พื้นที่หลักสำหรับแสดงเนื้อหาหน้าแดชบอร์ด */}
      <main className="min-w-0 p-6 md:p-10 bg-slate-50/40 dark:bg-slate-950/40 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
