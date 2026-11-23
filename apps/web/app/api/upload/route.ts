import { NextResponse } from "next/server";
import { isUploadedFile, saveUpload } from "@/lib/storage";

/** อัปโหลดไฟล์เดี่ยว (Supabase หรือ public/uploads ตาม env — ดู lib/storage.ts) */
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file");

    if (!isUploadedFile(file)) {
      return NextResponse.json(
        { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" },
        { status: 400 },
      );
    }

    // กำหนดชื่อไฟล์ไม่ให้ซ้ำกัน
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const url = await saveUpload(file, `upload-${uniqueSuffix}`, ".bin");

    return NextResponse.json({
      success: true,
      url,
      message: "อัปโหลดไฟล์สำเร็จ",
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" },
      { status: 500 },
    );
  }
}
