"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollIndicatorIcon() {
  const [opacity, setOpacity] = useState(1);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    // หน้าเลื่อนด้วย window ตัวเดียว → อ่านค่าปัจจุบันทุกครั้ง
    // จึงกลับมาแสดงปกติเมื่อเลื่อนกลับขึ้นบนสุด
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setOpacity(Math.max(0, 1 - scrollY / 120));
      setTranslateY(-Math.min(60, scrollY * 0.5));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        opacity,
        transform: `translate(-50%, ${translateY}px)`,
        visibility: opacity <= 0 ? "hidden" : "visible",
      }}
      className="absolute -top-16 left-1/2 z-30 flex flex-col items-center pointer-events-none transition-opacity duration-150"
    >
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-purple-400 opacity-70 animate-ping" />
        <div className="relative w-16 h-16 rounded-full bg-purple-950 text-white border-2 border-purple-200 shadow-[0_0_40px_rgba(192,132,252,1)] flex items-center justify-center animate-bounce">
          <ChevronUp className="size-8 text-purple-200 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
}
