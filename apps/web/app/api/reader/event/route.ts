import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookId, type, deltaSec = 0, percent = 0, sessionId } = body;

    if (!bookId || !type || !sessionId) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    // เซ็ตเวลาเป็นเที่ยงคืนของวันนี้ เพื่อใช้เป็น Key ในตาราง Daily Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. บันทึกประวัติการอ่านลง ReadingEvent
    await prisma.readingEvent.create({
      data: {
        bookId,
        sessionId,
        type,
        deltaSec,
        percent,
      },
    });

    // 2. อัปเดตสถิติรวมของเว็บไซต์รายวัน (SiteStatsDaily)
    const isNewSession = type === "OPEN" ? 1 : 0;
    await prisma.siteStatsDaily.upsert({
      where: { date: today },
      update: {
        sessions: { increment: isNewSession },
        totalSec: { increment: BigInt(deltaSec) },
      },
      create: {
        date: today,
        sessions: isNewSession,
        uniqueReaders: 1,
        totalSec: BigInt(deltaSec),
      },
    });

    // 3. อัปเดตสถิติรายเล่มรายวัน (BookStatsDaily)
    const isFinished = type === "FINISH" ? 1 : 0;
    await prisma.bookStatsDaily.upsert({
      where: {
        bookId_date: {
          bookId,
          date: today,
        },
      },
      update: {
        sessions: { increment: isNewSession },
        totalSec: { increment: BigInt(deltaSec) },
        finished: { increment: isFinished },
      },
      create: {
        bookId,
        date: today,
        sessions: isNewSession,
        uniqueReaders: 1,
        totalSec: BigInt(deltaSec),
        finished: isFinished,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Record reading event error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
