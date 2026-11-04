import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const siteStats = await prisma.siteStatsDaily.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
      },
      orderBy: {
        date: "asc",
      },
    });

    let totalSessions = 0;
    let totalSeconds = 0n;

    siteStats.forEach((stat) => {
      totalSessions += stat.sessions;
      totalSeconds += stat.totalSec;
    });

    const totalSecondsNumber = Number(totalSeconds);
    const avgSecondsPerSession =
      totalSessions > 0 ? Math.round(totalSecondsNumber / totalSessions) : 0;

    const topBooksRaw = await prisma.bookStatsDaily.groupBy({
      by: ["bookId"],
      where: {
        date: { gte: thirtyDaysAgo },
      },
      _sum: {
        sessions: true,
        totalSec: true,
        finished: true,
      },
      orderBy: {
        _sum: {
          sessions: "desc",
        },
      },
      take: 5,
    });

    const bookIds = topBooksRaw.map((item) => item.bookId);
    const booksInfo = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, title: true, author: true },
    });

    const bookMap = new Map(booksInfo.map((b) => [b.id, b]));

    const topBooks = topBooksRaw.map((item) => {
      const book = bookMap.get(item.bookId);
      return {
        id: item.bookId,
        title: book?.title || "ไม่ระบุชื่อหนังสือ",
        author: book?.author || "ไม่ระบุผู้แต่ง",
        sessions: item._sum.sessions || 0,
        totalSec: Number(item._sum.totalSec || 0), // 🌟 แปลง BigInt เป็น Number ที่นี่
        finished: item._sum.finished || 0,
      };
    });

    // 🌟 แปลง dailyStats ที่มี totalSec ชนิด BigInt ให้เป็น Number ธรรมดาก่อนส่ง JSON
    const formattedDailyStats = siteStats.map((stat) => ({
      ...stat,
      totalSec: Number(stat.totalSec),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSessions,
          totalSeconds: totalSecondsNumber,
          avgSecondsPerSession,
        },
        dailyStats: formattedDailyStats,
        topBooks,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
