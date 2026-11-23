import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { cookies } from "next/headers";
import { isUploadedFile, saveUpload } from "@/lib/storage";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

/** ผู้ใช้ปัจจุบันเป็นแอดมินที่ล็อกอินอยู่หรือไม่ */
async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const expected = await sessionToken();
  return !!token && !!expected && token === expected;
}

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

    // หนังสือที่ยังไม่เผยแพร่: ให้เห็นเฉพาะแอดมิน (ผู้ใช้ทั่วไปได้ 404 เหมือนไม่มีเล่มนี้)
    if (!book || (book.status !== "PUBLISHED" && !(await isAdmin()))) {
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
    const description = formData.get("description") as string;
    const fileType = formData.get("fileType") as any;
    const status = formData.get("status") as any;

    // 🌟 ดึงข้อมูลบรรณานุกรมใหม่ 5 ข้อ
    const publisher = formData.get("publisher") as string;
    const publicationInfo = formData.get("publicationInfo") as string;
    const pageCount = formData.get("pageCount") as string;
    const publishingProvince = formData.get("publishingProvince") as string;
    const ddc = formData.get("ddc") as any;

    const categoryIds = formData.getAll("categoryIds") as string[];

    const file = formData.get("file");
    const coverFile = formData.get("cover");

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

    // อัปโหลดไฟล์ใหม่ (ถ้ามี) — Supabase หรือ public/uploads ตาม env (ดู lib/storage.ts)
    if (isUploadedFile(file)) {
      fileUrl = await saveUpload(
        file,
        `${existingBook.slug}-${Date.now()}`,
        ".pdf",
      );
    }
    if (isUploadedFile(coverFile)) {
      coverUrl = await saveUpload(
        coverFile,
        `${existingBook.slug}-cover-${Date.now()}`,
        ".jpg",
      );
    }

    // 🌟 อัปเดตข้อมูลหนังสือในฐานข้อมูล (ล็อก slug ไม่ให้เปลี่ยนเพื่อป้องกันลิงก์ตาย)
    const updatedBook = await prisma.book.update({
      where: { id: existingBook.id },
      data: {
        title,
        author: author || "ไม่ระบุผู้แต่ง",
        description: description || null,
        fileUrl,
        coverUrl,
        fileType,
        status,
        // ข้อมูลบรรณานุกรมใหม่ 5 ข้อ
        publisher: publisher || null,
        publicationInfo: publicationInfo || null,
        pageCount: pageCount || null,
        publishingProvince: publishingProvince || null,
        ddc: ddc || existingBook.ddc || "GENERAL_000",
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
