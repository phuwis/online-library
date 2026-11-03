import { prisma } from "@repo/db";
import { startOfUtcDay } from "./aggregate";

// dashboard อ่านจากตาราง aggregate เท่านั้น (ห้าม groupBy บน ReadingEvent)

function since(days: number) {
  const today = startOfUtcDay(new Date());
  return new Date(today.getTime() - (days - 1) * 24 * 3600 * 1000);
}

export async function getOverview(days = 30) {
  const rows = await prisma.siteStatsDaily.findMany({
    where: { date: { gte: since(days) } },
    orderBy: { date: "asc" },
  });
  const series = rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    sessions: r.sessions,
    uniqueReaders: r.uniqueReaders,
    totalSec: Number(r.totalSec),
  }));
  const totalSessions = series.reduce((s, r) => s + r.sessions, 0);
  const totalSec = series.reduce((s, r) => s + r.totalSec, 0);
  return {
    series,
    totalSessions,
    totalSec,
    avgSecPerSession: totalSessions ? Math.round(totalSec / totalSessions) : 0,
  };
}

export async function getTopBooks(days = 30, limit = 10) {
  const grouped = await prisma.bookStatsDaily.groupBy({
    by: ["bookId"],
    where: { date: { gte: since(days) } },
    _sum: { sessions: true, totalSec: true, finished: true },
    orderBy: { _sum: { totalSec: "desc" } },
    take: limit,
  });
  const books = await prisma.book.findMany({
    where: { id: { in: grouped.map((g) => g.bookId) } },
    select: { id: true, title: true, slug: true },
  });
  const byId = new Map(books.map((b) => [b.id, b]));
  return grouped.map((g) => {
    const sessions = g._sum.sessions ?? 0;
    const finished = g._sum.finished ?? 0;
    return {
      bookId: g.bookId,
      title: byId.get(g.bookId)?.title ?? "(deleted)",
      slug: byId.get(g.bookId)?.slug ?? "",
      sessions,
      totalSec: Number(g._sum.totalSec ?? 0),
      finished,
      finishRate: sessions ? finished / sessions : 0,
    };
  });
}

export async function getBookSeries(bookId: string, days = 30) {
  const rows = await prisma.bookStatsDaily.findMany({
    where: { bookId, date: { gte: since(days) } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    sessions: r.sessions,
    totalSec: Number(r.totalSec),
    finished: r.finished,
  }));
}
