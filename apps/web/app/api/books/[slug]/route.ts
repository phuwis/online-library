import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const book = await prisma.book.findUnique({
      where: { slug: params.slug },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, message: "ไม่พบหนังสือ" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: { slug: string } }, // เปลี่ยนมารับแบบ Destructure ปกติเพื่อป้องกันปัญหา Promise ของ params ในบางเวอร์ชัน
) {
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
