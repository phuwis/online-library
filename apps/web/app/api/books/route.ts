import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const slugInput = formData.get("slug") as string;
    const fileType = (formData.get("fileType") as any) || "PDF";
    const status = (formData.get("status") as any) || "PUBLISHED";

    const file = formData.get("file") as File; // ไฟล์หนังสือหลัก (PDF/EPUB)
    const coverFile = formData.get("cover") as File; // ไฟล์รูปปก (ไม่บังคับ)

    if (!file || !title) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกข้อมูลและอัปโหลดไฟล์หนังสือให้ครบถ้วน",
        },
        { status: 400 },
      );
    }

    const slug =
      slugInput && slugInput.trim() !== "" ? slugInput : "book-" + Date.now();

    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // 1. บันทึกไฟล์หนังสือหลัก
    const fileExt = path.extname(file.name) || ".pdf";
    const fileName = `${slug}-${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const fileBytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileBytes));
    const fileUrl = `/uploads/${fileName}`;

    // 2. จัดการรูปปก (ถ้ามีการอัปโหลดรูปปกเพิ่ม นำมาใช้ ถ้าไม่มีให้เป็น null เพื่อให้ระบบแสดง Default Cover)
    let coverUrl = null;
    if (coverFile && coverFile.size > 0) {
      const coverExt = path.extname(coverFile.name) || ".jpg";
      const coverFileName = `${slug}-cover-${Date.now()}${coverExt}`;
      const coverFilePath = path.join(uploadDir, coverFileName);

      const coverBytes = await coverFile.arrayBuffer();
      await fs.writeFile(coverFilePath, Buffer.from(coverBytes));
      coverUrl = `/uploads/${coverFileName}`;
    }

    // 3. บันทึกลง Prisma Database
    const newBook = await prisma.book.create({
      data: {
        title,
        slug,
        author: author || "ไม่ระบุผู้แต่ง",
        fileUrl,
        coverUrl, // ถ้ามีอัปโหลดจะบันทึกรูปลงไป ถ้าไม่มีจะเป็น null (ใช้ Default)
        fileType,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, book: newBook });
  } catch (error: any) {
    console.error("Upload error details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการอัปโหลด" },
      { status: 500 },
    );
  }
}
