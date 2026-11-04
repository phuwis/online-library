import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

// 1. อัปเดตข้อมูลหมวดหมู่ (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    const { name, slug } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุชื่อหมวดหมู่" },
        { status: 400 },
      );
    }

    // สร้าง slug ใหม่หรือใช้ค่าเดิม
    const generatedSlug =
      slug || name.trim().toLowerCase().replace(/\s+/g, "-");

    // ตรวจสอบว่า slug ซ้ำกับหมวดหมู่อื่นหรือไม่
    const existing = await prisma.category.findFirst({
      where: {
        slug: generatedSlug,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "มี Slug นี้อยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น" },
        { status: 400 },
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: generatedSlug,
      },
    });

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่",
      },
      { status: 500 },
    );
  }
}

// 2. ลบหมวดหมู่ (DELETE) พร้อมบล็อกถ้ายังมีหนังสืออยู่
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // ตรวจสอบว่าหมวดหมู่นี้มีหนังสืออยู่หรือไม่ (อิงตาม schema แบบ Many-to-Many ผ่าน books)
    const categoryWithBooks = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    if (!categoryWithBooks) {
      return NextResponse.json(
        { success: false, error: "ไม่พบหมวดหมู่นี้ในระบบ" },
        { status: 404 },
      );
    }

    // ถ้ายังมีหนังสืออยู่ ห้ามลบเด็ดขาด
    if (categoryWithBooks._count.books > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบได้เนื่องจากมีหนังสือในหมวดหมู่นี้อยู่ ${categoryWithBooks._count.books} เล่ม`,
        },
        { status: 400 },
      );
    }

    // ถ้าไม่มีหนังสือ สามารถลบได้
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการลบ" },
      { status: 500 },
    );
  }
}
