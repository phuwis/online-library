import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
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

    const file = formData.get("file") as File;
    const coverFile = formData.get("cover") as File;

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

    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    let fileUrl = "";
    let coverUrl = "";

    // จัดการไฟล์หนังสือ (PDF)
    if (file && typeof file === "object" && "size" in file && file.size > 0) {
      const fileExt = path.extname(file.name) || ".pdf";
      const fileName = `${slug}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);
      const fileBytes = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(fileBytes));
      fileUrl = `/uploads/${fileName}`;
    }

    // จัดการไฟล์รูปปก
    if (
      coverFile &&
      typeof coverFile === "object" &&
      "size" in coverFile &&
      coverFile.size > 0
    ) {
      const coverExt = path.extname(coverFile.name) || ".jpg";
      const coverFileName = `${slug}-cover-${Date.now()}${coverExt}`;
      const coverFilePath = path.join(uploadDir, coverFileName);
      const coverBytes = await coverFile.arrayBuffer();
      await fs.writeFile(coverFilePath, Buffer.from(coverBytes));
      coverUrl = `/uploads/${coverFileName}`;
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

//FIXME: THIS CODE FOR UPLOAD FILE TO SUPABASE STORAGE INSTEAD OF LOCAL SERVER

// import { NextResponse } from "next/server";
// import { prisma } from "@repo/db";
// import { createClient } from "@supabase/supabase-js";
// import crypto from "crypto";

// function getDdcCodePrefix(ddc: string): string {
//   const match = ddc.match(/\d+/);
//   return match ? match[0] : "000";
// }

// function getSupabaseClient() {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//   if (!supabaseUrl || !supabaseKey) {
//     throw new Error("Supabase environment variables are missing.");
//   }

//   return createClient(supabaseUrl, supabaseKey);
// }

// const BUCKET_NAME = "library-files";

// export async function POST(req: Request) {
//   try {
//     const supabase = getSupabaseClient();
//     const formData = await req.formData();

//     const title = formData.get("title") as string;
//     const author = formData.get("author") as string;
//     const description = formData.get("description") as string;
//     const fileType = formData.get("fileType") as string;
//     const status = formData.get("status") as string;

//     const publisher = formData.get("publisher") as string;
//     const publicationInfo = formData.get("publicationInfo") as string;
//     const pageCount = formData.get("pageCount") as string;
//     const publishingProvince = formData.get("publishingProvince") as string;
//     const ddc = (formData.get("ddc") as string) || "GENERAL_000";

//     const categoryIds = formData.getAll("categoryIds") as string[];

//     const file = formData.get("file") as File;
//     const coverFile = formData.get("cover") as File;

//     const slug = `book-${crypto.randomBytes(6).toString("hex")}`;
//     const ddcPrefix = getDdcCodePrefix(ddc);
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, "0");
//     const day = String(now.getDate()).padStart(2, "0");
//     const dateStr = `${year}${month}${day}`;

//     const bookCode = await prisma.$transaction(async (tx) => {
//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date();
//       endOfDay.setHours(23, 59, 59, 999);

//       const countToday = await tx.book.count({
//         where: {
//           createdAt: { gte: startOfDay, lte: endOfDay },
//         },
//       });

//       const runningNumber = String(countToday + 1).padStart(5, "0");
//       return `${ddcPrefix}-${dateStr}-${runningNumber}`;
//     });

//     let fileUrl = "";
//     let coverUrl = "";

//     if (file && typeof file === "object" && "size" in file && file.size > 0) {
//       const fileExt = file.name.split(".").pop() || "pdf";
//       const fileName = `${slug}-${Date.now()}.${fileExt}`;
//       const buffer = Buffer.from(await file.arrayBuffer());

//       const { data, error } = await supabase.storage
//         .from(BUCKET_NAME)
//         .upload(fileName, buffer, {
//           contentType: file.type,
//           upsert: false,
//         });

//       if (error) {
//         throw new Error("อัปโหลดไฟล์หนังสือไม่สำเร็จ: " + error.message);
//       }

//       const { data: publicUrlData } = supabase.storage
//         .from(BUCKET_NAME)
//         .getPublicUrl(data.path);

//       fileUrl = publicUrlData.publicUrl;
//     }

//     if (
//       coverFile &&
//       typeof coverFile === "object" &&
//       "size" in coverFile &&
//       coverFile.size > 0
//     ) {
//       const coverExt = coverFile.name.split(".").pop() || "jpg";
//       const coverFileName = `${slug}-cover-${Date.now()}.${coverExt}`;
//       const buffer = Buffer.from(await coverFile.arrayBuffer());

//       const { data, error } = await supabase.storage
//         .from(BUCKET_NAME)
//         .upload(coverFileName, buffer, {
//           contentType: coverFile.type,
//           upsert: false,
//         });

//       if (error) {
//         throw new Error("อัปโหลดรูปปกไม่สำเร็จ: " + error.message);
//       }

//       const { data: publicUrlData } = supabase.storage
//         .from(BUCKET_NAME)
//         .getPublicUrl(data.path);

//       coverUrl = publicUrlData.publicUrl;
//     }

//     const newBook = await prisma.book.create({
//       data: {
//         bookCode,
//         slug,
//         title,
//         author: author || "ไม่ระบุผู้แต่ง",
//         description: description || null,
//         fileUrl,
//         coverUrl: coverUrl || null,
//         fileType: (fileType as any) || "PDF",
//         status: (status as any) || "DRAFT",
//         publishedAt: status === "PUBLISHED" ? new Date() : null,
//         publisher: publisher || null,
//         publicationInfo: publicationInfo || null,
//         pageCount: pageCount || null,
//         publishingProvince: publishingProvince || null,
//         ddc: ddc as any,
//         categories: {
//           create: categoryIds.map((catId) => ({
//             category: {
//               connect: { id: catId },
//             },
//           })),
//         },
//       },
//       include: {
//         categories: {
//           include: {
//             category: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json({ success: true, book: newBook });
//   } catch (error: any) {
//     console.error("Error creating book:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || "เกิดข้อผิดพลาดในการสร้างหนังสือ",
//       },
//       { status: 500 },
//     );
//   }
// }
