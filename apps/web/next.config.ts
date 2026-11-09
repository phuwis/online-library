import path from "node:path";
import type { NextConfig } from "next";

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
};

export default nextConfig;
