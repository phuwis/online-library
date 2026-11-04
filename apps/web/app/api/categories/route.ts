import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

// 1. ดึงรายการหมวดหมู่ทั้งหมด
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { books: true },
        },
        books: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่",
      },
      { status: 500 },
    );
  }
}

// 2. เพิ่มหมวดหมู่ใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุชื่อหมวดหมู่" },
        { status: 400 },
      );
    }

    // สร้าง slug อัตโนมัติถ้าไม่ได้ส่งมา
    const generatedSlug =
      slug || name.trim().toLowerCase().replace(/\s+/g, "-");

    // ตรวจสอบว่า slug ซ้ำหรือไม่
    const existing = await prisma.category.findUnique({
      where: { slug: generatedSlug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "มี Slug นี้อยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น" },
        { status: 400 },
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
      },
    });

    return NextResponse.json(
      { success: true, data: newCategory },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการสร้างหมวดหมู่",
      },
      { status: 500 },
    );
  }
}
