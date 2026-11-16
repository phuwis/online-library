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

//FIXME: THIS CODE FOR UPLOAD FILE TO SUPABASE STORAGE INSTEAD OF LOCAL SERVER

// import { NextResponse } from "next/server";
// import { prisma } from "@repo/db";
// import { createClient } from "@supabase/supabase-js";

// function getSupabaseClient() {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//   if (!supabaseUrl || !supabaseKey) {
//     throw new Error("Supabase environment variables are missing.");
//   }

//   return createClient(supabaseUrl, supabaseKey);
// }

// const BUCKET_NAME = "library-files";

// export async function GET(
//   req: Request,
//   { params }: { params: Promise<{ slug: string }> },
// ) {
//   try {
//     const { slug } = await params;
//     const book = await prisma.book.findUnique({
//       where: { slug },
//       include: {
//         categories: { include: { category: true } },
//       },
//     });

//     if (!book) {
//       return NextResponse.json(
//         { success: false, error: "ไม่พบข้อมูลหนังสือ" },
//         { status: 404 },
//       );
//     }

//     return NextResponse.json({ success: true, book });
//   } catch (error: any) {
//     return NextResponse.json(
//       { success: false, error: error.message },
//       { status: 500 },
//     );
//   }
// }

// export async function PUT(
//   req: Request,
//   { params }: { params: Promise<{ slug: string }> },
// ) {
//   try {
//     const supabase = getSupabaseClient();
//     const resolvedParams = await params;
//     const slugParam = resolvedParams.slug;

//     const formData = await req.formData();
//     const title = formData.get("title") as string;
//     const author = formData.get("author") as string;
//     const description = formData.get("description") as string;
//     const fileType = formData.get("fileType") as any;
//     const status = formData.get("status") as any;
//
//     const publisher = formData.get("publisher") as string;
//     const publicationInfo = formData.get("publicationInfo") as string;
//     const pageCount = formData.get("pageCount") as string;
//     const publishingProvince = formData.get("publishingProvince") as string;
//     const ddc = formData.get("ddc") as any;

//     const categoryIds = formData.getAll("categoryIds") as string[];

//     const file = formData.get("file") as File;
//     const coverFile = formData.get("cover") as File;

//     const existingBook = await prisma.book.findUnique({
//       where: { slug: slugParam },
//     });

//     if (!existingBook) {
//       return NextResponse.json(
//         { success: false, error: "ไม่พบข้อมูลหนังสือ" },
//         { status: 404 },
//       );
//     }

//     let fileUrl = existingBook.fileUrl;
//     let coverUrl = existingBook.coverUrl;

//     if (file && typeof file === "object" && "size" in file && file.size > 0) {
//       const fileExt = file.name.split(".").pop() || "pdf";
//       const fileName = `book-${Date.now()}.${fileExt}`;
//       const buffer = Buffer.from(await file.arrayBuffer());

//       const { data, error } = await supabase.storage
//         .from(BUCKET_NAME)
//         .upload(fileName, buffer, { contentType: file.type, upsert: false });

//       if (error)
//         throw new Error("อัปโหลดไฟล์หนังสือไม่สำเร็จ: " + error.message);

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
//       const coverFileName = `cover-${Date.now()}.${coverExt}`;
//       const buffer = Buffer.from(await coverFile.arrayBuffer());

//       const { data, error } = await supabase.storage
//         .from(BUCKET_NAME)
//         .upload(coverFileName, buffer, {
//           contentType: coverFile.type,
//           upsert: false,
//         });

//       if (error) throw new Error("อัปโหลดรูปปกไม่สำเร็จ: " + error.message);

//       const { data: publicUrlData } = supabase.storage
//         .from(BUCKET_NAME)
//         .getPublicUrl(data.path);
//       coverUrl = publicUrlData.publicUrl;
//     }

//     const updatedBook = await prisma.book.update({
//       where: { id: existingBook.id },
//       data: {
//         title,
//         author: author || "ไม่ระบุผู้แต่ง",
//         description: description || null,
//         fileUrl,
//         coverUrl,
//         fileType,
//         status,
//         publisher: publisher || null,
//         publicationInfo: publicationInfo || null,
//         pageCount: pageCount || null,
//         publishingProvince: publishingProvince || null,
//         ddc: ddc || existingBook.ddc || "GENERAL_000",
//         publishedAt:
//           status === "PUBLISHED" && !existingBook.publishedAt
//             ? new Date()
//             : existingBook.publishedAt,
//         categories: {
//           deleteMany: {},
//           create: categoryIds.map((catId) => ({
//             category: { connect: { id: catId } },
//           })),
//         },
//       },
//       include: { categories: { include: { category: true } } },
//     });

//     return NextResponse.json({ success: true, book: updatedBook });
//   } catch (error: any) {
//     console.error("Update error detail:", error);
//     return NextResponse.json(
//       { success: false, error: error.message },
//       { status: 500 },
//     );
//   }
// }
