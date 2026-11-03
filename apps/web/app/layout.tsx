import type { Metadata } from "next";
// @ts-expect-error Next.js processes global CSS imports at build time.
import "./globals.css";

export const metadata: Metadata = {
  title: "Online Library",
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
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
