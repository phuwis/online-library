"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Library } from "lucide-react";

const NAV_ITEMS = [
  { href: "/books", label: "หนังสือทั้งหมด", icon: Library },
  { href: "/about", label: "เกี่ยวกับเรา", icon: Landmark },
];

/** เมนูใน header ของหน้าบ้าน — ไฮไลต์หน้าที่กำลังเปิดอยู่ (มือถือแสดงเฉพาะไอคอน) */
export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูหลัก" className="flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 h-9 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:text-foreground hover:bg-primary/10"
            }`}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
