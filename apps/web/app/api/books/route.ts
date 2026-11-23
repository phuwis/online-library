import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import crypto from "crypto";
import { isUploadedFile, saveUpload } from "@/lib/storage";
import {
  listPublishedBooksBySlugs,
  MAX_SLUG_LOOKUP,
} from "@/features/books/queries";

/**
 * GET /api/books?slugs=a,b,c
 * หน้าบ้านใช้ดึงข้อมูลหนังสือจาก slug ที่เก็บไว้ใน localStorage (บุ๊กมาร์ก / อ่านค้าง)
 * คืนเฉพาะเล่มที่ PUBLISHED ตามลำดับ slug ที่ส่งมา
 */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("slugs") ?? "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,100}$/i.test(s))
    .slice(0, MAX_SLUG_LOOKUP);

  const books = await listPublishedBooksBySlugs(slugs);
  return NextResponse.json({ books });
}

// ฟังก์ชันช่วยแปลง DDC Enum เป็นรหัสตัวเลข 3 หลัก (เช่น GENERAL_000 -> 000)
function getDdcCodePrefix(ddc: string): string {
  const match = ddc.match(/\d+/);
  return match ? match[0] : "000";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const fileType = formData.get("fileType") as string;
    const status = formData.get("status") as string;

    // 🌟 ดึงข้อมูลบรรณานุกรมใหม่ 5 ข้อ
    const publisher = formData.get("publisher") as string;
    const publicationInfo = formData.get("publicationInfo") as string;
    const pageCount = formData.get("pageCount") as string;
    const publishingProvince = formData.get("publishingProvince") as string;
    const ddc = (formData.get("ddc") as string) || "GENERAL_000";

    // 🌟 ดึงค่า categoryIds ทั้งหมดที่ส่งมาจาก FormData (จะได้เป็น Array ของ ID)
    const categoryIds = formData.getAll("categoryIds") as string[];

    const file = formData.get("file");
    const coverFile = formData.get("cover");

    // 🌟 1. Gen Auto Slug (สุ่มปลอดภัย ห้ามแก้)
    const slug = `book-${crypto.randomBytes(6).toString("hex")}`;

    // 🌟 2. Gen Auto Book Code รูปแบบ ddc-YYYYMMDD-XXXXX (รองรับ 10,000 เล่ม/วัน)
    const ddcPrefix = getDdcCodePrefix(ddc);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    const bookCode = await prisma.$transaction(async (tx) => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const countToday = await tx.book.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const runningNumber = String(countToday + 1).padStart(5, "0");
      return `${ddcPrefix}-${dateStr}-${runningNumber}`;
    });

    // อัปโหลดไฟล์ (Supabase หรือ public/uploads ตาม env — ดู lib/storage.ts)
    let fileUrl = "";
    let coverUrl = "";
    if (isUploadedFile(file)) {
      fileUrl = await saveUpload(file, `${slug}-${Date.now()}`, ".pdf");
    }
    if (isUploadedFile(coverFile)) {
      coverUrl = await saveUpload(
        coverFile,
        `${slug}-cover-${Date.now()}`,
        ".jpg",
      );
    }

    // 🌟 บันทึกข้อมูลหนังสือพร้อมฟิลด์ใหม่และความสัมพันธ์ Many-to-Many กับหมวดหมู่
    const newBook = await prisma.book.create({
      data: {
        bookCode,
        slug,
        title,
        author: author || "ไม่ระบุผู้แต่ง",
        description: description || null,
        fileUrl,
        coverUrl: coverUrl || null,
        fileType: (fileType as any) || "PDF",
        status: (status as any) || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        // ข้อมูลบรรณานุกรมใหม่
        publisher: publisher || null,
        publicationInfo: publicationInfo || null,
        pageCount: pageCount || null,
        publishingProvince: publishingProvince || null,
        ddc: ddc as any,
        // เชื่อมโยงหมวดหมู่ผ่านตาราง BookCategory
        categories: {
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

    return NextResponse.json({ success: true, book: newBook });
  } catch (error: any) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการสร้างหนังสือ",
      },
      { status: 500 },
    );
  }
}
