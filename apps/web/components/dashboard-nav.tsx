"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Tags } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const items = [
  { href: "/dashboard", label: "ภาพรวมและสถิติ", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/books", label: "หนังสือ", icon: BookOpen },
  { href: "/dashboard/categories", label: "หมวดหมู่", icon: Tags },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 md:flex-col">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
