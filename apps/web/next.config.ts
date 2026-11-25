import { createRequire } from "node:module";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * pdf.js (ที่มากับ react-pdf) รุ่นปกติใช้ JavaScript ใหม่มาก เช่น
 * Map.prototype.getOrInsertComputed ซึ่ง Safari บน iPhone รองรับตั้งแต่ iOS 26.2 เท่านั้น
 * → iPhone ที่ยังไม่อัปเดตจะเปิด PDF ไม่ได้
 *
 * แก้โดยชี้ "pdfjs-dist" ทุกจุดไปที่ legacy build (มี polyfill ในตัว)
 * และใช้ pdfjs-dist ชุดเดียวกับที่ react-pdf ใช้ เพื่อให้เวอร์ชัน API กับ worker ตรงกันเสมอ
 */
const requireFromWeb = createRequire(path.join(__dirname, "package.json"));
const reactPdfEntry = requireFromWeb.resolve("react-pdf");
const pdfjsEntry = createRequire(reactPdfEntry).resolve("pdfjs-dist"); // .../pdfjs-dist/build/pdf.mjs
const pdfjsDir = path.dirname(path.dirname(pdfjsEntry));

const nextConfig: NextConfig = {
  // สร้าง bundle แบบ standalone สำหรับ Docker (แทน deploy-package/ เดิม)
  output: "standalone",
  // monorepo: ให้ trace ไฟล์จาก root ของ repo
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // แพ็กเกจในเวิร์กสเปซที่เป็น TypeScript source
  transpilePackages: ["@repo/ui", "@repo/db", "@repo/analytics"],
  // 🌟 เพิ่มการตั้งค่าอนุญาตโดเมนรูปภาพจาก Supabase Storage ที่นี่
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist$": path.join(pdfjsDir, "legacy/build/pdf.mjs"),
      "pdfjs-dist/web/pdf_viewer.mjs$": path.join(
        pdfjsDir,
        "legacy/web/pdf_viewer.mjs",
      ),
      "pdfjs-dist/build/pdf.worker.min.mjs$": path.join(
        pdfjsDir,
        "legacy/build/pdf.worker.min.mjs",
      ),
    };
    return config;
  },
};

export default nextConfig;
