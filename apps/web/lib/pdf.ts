"use client";

/**
 * จุดเดียวที่โหลด react-pdf + ตั้งค่า worker
 * - import ผ่านไฟล์นี้เสมอ (ผ่าน next/dynamic) เพื่อให้ workerSrc ถูกตั้งก่อน <Document> เริ่มโหลด
 * - worker โฮสต์จากเว็บเราเอง (bundle โดย webpack) ไม่พึ่ง unpkg
 * - "pdfjs-dist/build/pdf.worker.min.mjs" ถูก alias ไปเป็น legacy worker ใน next.config.ts
 */
import { pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

export { Document, Page, pdfjs } from "react-pdf";
