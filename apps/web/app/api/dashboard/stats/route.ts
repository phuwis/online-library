import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 7;
    const limitDays = isNaN(days) ? 7 : days;

    // 🌟 ดึงวันที่ปัจจุบันตามเวลาประเทศไทย (UTC+7)
    const nowThaiStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    const todayThai = new Date(nowThaiStr);
    todayThai.setHours(0, 0, 0, 0);

    const startDate = new Date(todayThai);
    startDate.setDate(startDate.getDate() - (limitDays - 1));

    const siteStats = await prisma.siteStatsDaily.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: {
        date: "asc",
      },
    });

    const statsMap = new Map();
    siteStats.forEach((stat) => {
      // แปลงวันที่ใน DB ให้แสดงผลตรงกับโซนเวลาไทย
      const statDateStr = new Date(stat.date).toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      }); // ได้รูปแบบ YYYY-MM-DD
      statsMap.set(statDateStr, stat);
    });

    let totalSessions = 0;
    let totalSeconds = 0n;

    siteStats.forEach((stat) => {
      totalSessions += stat.sessions;
      totalSeconds += stat.totalSec;
    });

    // สร้างอาเรย์ย้อนหลังตามเวลาไทยจริง
    const formattedDailyStats = [];
    for (let i = limitDays - 1; i >= 0; i--) {
      const d = new Date(todayThai);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      });

      const existing = statsMap.get(dateStr);
      if (existing) {
        formattedDailyStats.push({
          date: dateStr,
          sessions: existing.sessions,
          totalSec: Number(existing.totalSec),
        });
      } else {
        formattedDailyStats.push({
          date: dateStr,
          sessions: 0,
          totalSec: 0,
        });
      }
    }

    const totalSecondsNumber = Number(totalSeconds);
    const avgSecondsPerSession =
      totalSessions > 0 ? Math.round(totalSecondsNumber / totalSessions) : 0;

    const topBooksRaw = await prisma.bookStatsDaily.groupBy({
      by: ["bookId"],
      where: {
        date: { gte: startDate },
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
        totalSec: Number(item._sum.totalSec || 0),
        finished: item._sum.finished || 0,
      };
    });

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
