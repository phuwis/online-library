"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!mounted) {
    // ป้องกันการแสดงผลเหลื่อมกันขณะโหลด (Hydration Mismatch)
    return (
      <div className="w-16 h-8 rounded-full bg-secondary/50 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`สลับธีม (ตอนนี้: ${isDark ? "โหมดมืด" : "โหมดสว่าง"})`}
      className="relative flex items-center w-16 h-8 p-1 rounded-full bg-secondary/80 border border-border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
    >
      {/* วงกลมสไลด์ (Thumb) พร้อมไอคอน */}
      <div
        className={`flex items-center justify-center w-6 h-6 rounded-full bg-background shadow-md transform transition-transform duration-300 ease-in-out ${
          isDark ? "translate-x-8" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="size-3.5 text-blue-400" />
        ) : (
          <Sun className="size-3.5 text-amber-500" />
        )}
      </div>

      {/* ไอคอนฝั่งตรงข้ามที่อยู่เบื้องหลัง */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none text-muted-foreground">
        <Sun
          className={`size-3.5 transition-opacity duration-300 ${isDark ? "opacity-60" : "opacity-0"}`}
        />
        <Moon
          className={`size-3.5 transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-60"}`}
        />
      </div>
    </button>
  );
}
