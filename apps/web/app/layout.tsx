import type { Metadata } from "next";
import { Toaster } from "sonner"; // @ts-expect-error Next.js processes global CSS imports at build time.
import "./globals.css";

export const metadata: Metadata = {
  title: "ห้องสมุดกระทรวงมหาดไทย",
  description: "ห้องสมุดออนไลน์ อ่านหนังสือ e-book ได้ทุกที่",
};

// ตั้งค่า dark/light ก่อนหน้าจอ render เพื่อไม่ให้เกิดการกะพริบ
const themeScript = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* 🌟 ไอคอนตราสัญลักษณ์กระทรวงมหาดไทยบนแท็บเบราว์เซอร์ */}
        <link
          rel="icon"
          href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8JlhtBJqp7gVwX4qm2t5OGY8xHw1TcPrJYtbIIMC3kQ3rzBkd67svfEP5&s=10"
        />
      </head>
      <body className="min-h-screen">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
