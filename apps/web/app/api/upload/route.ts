import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // กำหนดชื่อไฟล์ไม่ให้ซ้ำกัน
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}-${file.name.replace(/\s/g, "_")}`;

    // กำหนด Path โฟลเดอร์ uploads
    const uploadDir = path.join(process.cwd(), "public/uploads");

    // ** เพิ่มส่วนนี้: ตรวจสอบและสร้างโฟลเดอร์ public/uploads หากยังไม่มี **
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
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
