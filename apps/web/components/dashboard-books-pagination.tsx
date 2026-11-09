"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Check } from "lucide-react";

interface Props {
  currentLimit: number;
  currentPage: number;
  totalPages: number;
  q?: string;
  date?: string;
  category?: string;
}

export function DashboardBooksPagination({
  currentLimit,
  currentPage,
  totalPages,
  q,
  date,
  category,
}: Props) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (date) params.set("date", date);
    if (category) params.set("category", category);
    params.set("page", "1"); // รีเซ็ตกลับหน้า 1 เมื่อเปลี่ยน limit
    params.set("limit", newLimit.toString());

    setShowDropdown(false);
    router.push(`/dashboard/books?${params.toString()}`);
  };

  return (
    <div className="relative ml-4" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        className="flex items-center justify-between px-3 py-1.5 text-xs border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-28"
      >
        <span>{currentLimit} / หน้า</span>
        <Search className="size-3 text-muted-foreground" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-1 w-28 bg-popover border border-border rounded-lg shadow-lg py-1 z-50 text-xs">
          {[10, 20, 50, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleLimitChange(val)}
              className={`w-full flex items-center justify-between px-3 py-2 hover:bg-muted/60 transition-colors ${
                currentLimit === val
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-popover-foreground"
              }`}
            >
              <span>{val} / หน้า</span>
              {currentLimit === val && <Check className="size-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
