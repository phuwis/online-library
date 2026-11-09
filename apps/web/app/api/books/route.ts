// import { NextResponse } from "next/server";
// import { prisma } from "@repo/db";
// import fs from "fs/promises";
// import path from "path";

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();

//     const title = formData.get("title") as string;
//     const author = formData.get("author") as string;
//     const slug = formData.get("slug") as string;
//     const fileType = formData.get("fileType") as string;
//     const status = formData.get("status") as string;

//     // 🌟 1. ดึงค่า categoryIds ทั้งหมดที่ส่งมาจาก FormData (จะได้เป็น Array ของ ID)
//     const categoryIds = formData.getAll("categoryIds") as string[];

//     const file = formData.get("file") as File;
//     const coverFile = formData.get("cover") as File;

//     const uploadDir = path.resolve(process.cwd(), "public/uploads");
//     await fs.mkdir(uploadDir, { recursive: true });

//     let fileUrl = "";
//     let coverUrl = "";

//     // จัดการไฟล์หนังสือ (PDF)
//     if (file && typeof file === "object" && "size" in file && file.size > 0) {
//       const fileExt = path.extname(file.name) || ".pdf";
//       const fileName = `${slug || "book"}-${Date.now()}${fileExt}`;
//       const filePath = path.join(uploadDir, fileName);
//       const fileBytes = await file.arrayBuffer();
//       await fs.writeFile(filePath, Buffer.from(fileBytes));
//       fileUrl = `/uploads/${fileName}`;
//     }

//     // จัดการไฟล์รูปปก
//     if (
//       coverFile &&
//       typeof coverFile === "object" &&
//       "size" in coverFile &&
//       coverFile.size > 0
//     ) {
//       const coverExt = path.extname(coverFile.name) || ".jpg";
//       const coverFileName = `${slug || "book"}-cover-${Date.now()}${coverExt}`;
//       const coverFilePath = path.join(uploadDir, coverFileName);
//       const coverBytes = await coverFile.arrayBuffer();
//       await fs.writeFile(coverFilePath, Buffer.from(coverBytes));
//       coverUrl = `/uploads/${coverFileName}`;
//     }

//     // 🌟 2. บันทึกข้อมูลหนังสือพร้อมสร้างความสัมพันธ์ Many-to-Many กับหมวดหมู่
//     const newBook = await prisma.book.create({
//       data: {
//         title,
//         slug: slug || `book-${Date.now()}`,
//         author: author || "ไม่ระบุผู้แต่ง",
//         fileUrl,
//         coverUrl: coverUrl || null,
//         fileType: (fileType as any) || "PDF",
//         status: (status as any) || "DRAFT",
//         publishedAt: status === "PUBLISHED" ? new Date() : null,
//         // เชื่อมโยงหมวดหมู่ผ่านตาราง BookCategory
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

//FIXME: THIS CODE FOR UPLOAD FILE TO SUPABASE STORAGE INSTEAD OF LOCAL SERVER

import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { createClient } from "@supabase/supabase-js";

// สร้างฟังก์ชันช่วยเรียกใช้ Supabase Client (Lazy Load ป้องกันปัญหาตอน Build)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

const BUCKET_NAME = "library-files"; // ชื่อ Bucket บน Supabase ของคุณ

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const slug = formData.get("slug") as string;
    const fileType = formData.get("fileType") as string;
    const status = formData.get("status") as string;

    // ดึงค่า categoryIds ทั้งหมดที่ส่งมาจาก FormData
    const categoryIds = formData.getAll("categoryIds") as string[];

    const file = formData.get("file") as File;
    const coverFile = formData.get("cover") as File;

    let fileUrl = "";
    let coverUrl = "";

    // 1. จัดการอัปโหลดไฟล์หนังสือ (PDF/EPUB) ขึ้น Supabase Storage
    if (file && typeof file === "object" && "size" in file && file.size > 0) {
      const fileExt = file.name.split(".").pop() || "pdf";
      const fileName = `${slug || "book"}-${Date.now()}.${fileExt}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw new Error("อัปโหลดไฟล์หนังสือไม่สำเร็จ: " + error.message);
      }

      // ดึง Public URL ของไฟล์หนังสือ
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      fileUrl = publicUrlData.publicUrl;
    }

    // 2. จัดการอัปโหลดไฟล์รูปปกขึ้น Supabase Storage
    if (
      coverFile &&
      typeof coverFile === "object" &&
      "size" in coverFile &&
      coverFile.size > 0
    ) {
      const coverExt = coverFile.name.split(".").pop() || "jpg";
      const coverFileName = `${slug || "book"}-cover-${Date.now()}.${coverExt}`;
      const buffer = Buffer.from(await coverFile.arrayBuffer());

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(coverFileName, buffer, {
          contentType: coverFile.type,
          upsert: false,
        });

      if (error) {
        throw new Error("อัปโหลดรูปปกไม่สำเร็จ: " + error.message);
      }

      // ดึง Public URL ของรูปปก
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      coverUrl = publicUrlData.publicUrl;
    }

    // 3. บันทึกข้อมูลหนังสือพร้อมสร้างความสัมพันธ์กับหมวดหมู่ลงฐานข้อมูล
    const newBook = await prisma.book.create({
      data: {
        title,
        slug: slug || `book-${Date.now()}`,
        author: author || "ไม่ระบุผู้แต่ง",
        fileUrl,
        coverUrl: coverUrl || null,
        fileType: (fileType as any) || "PDF",
        status: (status as any) || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
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
