import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import { DashboardNav } from "@/components/dashboard-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground md:border-b-0 md:border-r md:border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BookOpen className="size-5" />
            Online Library
          </Link>
          <div className="md:hidden"><ThemeToggle /></div>
        </div>
        <DashboardNav />
        <div className="mt-auto hidden flex-col gap-2 md:flex">
          <Separator />
          <div className="flex items-center justify-between">
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit"><LogOut className="size-4" />ออกจากระบบ</Button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
