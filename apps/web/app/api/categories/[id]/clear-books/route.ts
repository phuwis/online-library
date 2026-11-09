import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "ไม่พบรหัสหมวดหมู่" },
        { status: 400 },
      );
    }

    // ลบความสัมพันธ์ทั้งหมดในตาราง BookCategory ที่ตรงกับ categoryId นี้
    await prisma.bookCategory.deleteMany({
      where: { categoryId },
    });

    return NextResponse.json({
      success: true,
      message: "เคลียร์หมวดหมู่สำเร็จ",
    });
  } catch (error: any) {
    console.error("Clear category books error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
