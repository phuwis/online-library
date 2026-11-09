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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolvedParams = await params;
    const slugParam = resolvedParams.slug;

    if (!slugParam) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ slug ของหนังสือ" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const newSlug = formData.get("slug") as string;
    const fileType = formData.get("fileType") as any;
    const status = formData.get("status") as any;

    const categoryIds = formData.getAll("categoryIds") as string[];

    const file = formData.get("file") as File;
    const coverFile = formData.get("cover") as File;

    // ค้นหาหนังสือเดิมจาก slug ใน URL params
    const existingBook = await prisma.book.findUnique({
      where: { slug: slugParam },
    });

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลหนังสือ" },
        { status: 404 },
      );
    }

    let fileUrl = existingBook.fileUrl;
    let coverUrl = existingBook.coverUrl;

    // ตรวจสอบและสร้างโฟลเดอร์ uploads บน Server ป้องกัน Error
    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error("Failed to create upload directory:", mkdirError);
    }

    // เช็คไฟล์หนังสือใหม่
    if (file && typeof file === "object" && "size" in file && file.size > 0) {
      const fileExt = path.extname(file.name) || ".pdf";
      const fileName = `book-${Date.now()}${fileExt}`;
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
      const coverFileName = `cover-${Date.now()}${coverExt}`;
      const coverFilePath = path.join(uploadDir, coverFileName);

      const coverBytes = await coverFile.arrayBuffer();
      await fs.writeFile(coverFilePath, Buffer.from(coverBytes));
      coverUrl = `/uploads/${coverFileName}`;
    }

    // อัปเดตข้อมูลหนังสือในฐานข้อมูลโดยอ้างอิงจาก ID เดิม แต่ใช้ Slug ตาม URL
    const updatedBook = await prisma.book.update({
      where: { id: existingBook.id },
      data: {
        title,
        slug: newSlug || existingBook.slug,
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
          deleteMany: {},
          create: categoryIds.map((catId) => ({
            category: {
              connect: { id: catId },
            },
          })),
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, book: updatedBook });
  } catch (error: any) {
    console.error("Update error detail:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" },
      { status: 500 },
    );
  }
}
