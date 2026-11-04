import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const book = await prisma.book.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลหนังสือ" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error("Get book by slug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, context: { params: { slug: string } }) {
  try {
    const id = context.params.slug;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบรหัสหนังสือ (ID)" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const slug = formData.get("slug") as string;
    const fileType = formData.get("fileType") as any;
    const status = formData.get("status") as any;

    // 🌟 1. ดึงค่า categoryIds ทั้งหมดที่ส่งมาจาก FormData (จะได้เป็น Array ของ ID หมวดหมู่)
    const categoryIds = formData.getAll("categoryIds") as string[];

    const file = formData.get("file") as File;
    const coverFile = formData.get("cover") as File;

    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลหนังสือ" },
        { status: 404 },
      );
    }

    let fileUrl = existingBook.fileUrl;
    let coverUrl = existingBook.coverUrl;

    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // เช็คไฟล์หนังสือใหม่
    if (file && typeof file === "object" && "size" in file && file.size > 0) {
      const fileExt = path.extname(file.name) || ".pdf";
      const fileName = `${slug || "book"}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      const fileBytes = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(fileBytes));
      fileUrl = `/uploads/${fileName}`;
    }

    // เช็คไฟล์รูปปกใหม่
    if (
      coverFile &&
      typeof coverFile === "object" &&
      "size" in coverFile &&
      coverFile.size > 0
    ) {
      const coverExt = path.extname(coverFile.name) || ".jpg";
      const coverFileName = `${slug || "book"}-cover-${Date.now()}${coverExt}`;
      const coverFilePath = path.join(uploadDir, coverFileName);

      const coverBytes = await coverFile.arrayBuffer();
      await fs.writeFile(coverFilePath, Buffer.from(coverBytes));
      coverUrl = `/uploads/${coverFileName}`;
    }

    // 🌟 2. อัปเดตข้อมูลหนังสือพร้อมกับจัดการความสัมพันธ์หมวดหมู่ (Many-to-Many)
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title,
        slug: slug || existingBook.slug,
        author: author || "ไม่ระบุผู้แต่ง",
        fileUrl,
        coverUrl,
        fileType,
        status,
        publishedAt:
          status === "PUBLISHED" && !existingBook.publishedAt
            ? new Date()
            : existingBook.publishedAt,
        categories: {
          deleteMany: {}, // ลบความสัมพันธ์หมวดหมู่เดิมทั้งหมดทิ้งก่อน
          create: categoryIds.map((catId) => ({
            category: {
              connect: { id: catId }, // เชื่อมโยงกับหมวดหมู่ใหม่ที่เลือก
            },
          })),
        },
      },
      include: {
        categories: {
          include: {
            category: true, // ดึงข้อมูลหมวดหมู่กลับมาด้วยเพื่อให้เห็นผลลัพธ์ทันที
          },
        },
      },
    });

    return NextResponse.json({ success: true, book: updatedBook });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
