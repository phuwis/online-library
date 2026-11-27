import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { siteTotals } from "@/features/analytics/dashboard-queries";
import type { SiteTotals } from "@/features/analytics/dashboard-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats/visits — ตัวนับผู้เข้าชมสำหรับหน้าบ้าน (เปิดให้ทุกคนอ่านได้)
 * แคชไว้ในหน่วยความจำ 5 นาที เพราะทุกหน้าของเว็บเรียกใช้
 */
const TTL_MS = 5 * 60 * 1000;
const g = globalThis as unknown as {
  visitTotals?: { at: number; data: SiteTotals };
  visitTotalsPending?: Promise<SiteTotals>;
};

async function load(): Promise<SiteTotals> {
  const cached = g.visitTotals;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  // ป้องกันหลาย request ยิง query พร้อมกันตอนแคชหมดอายุ
  g.visitTotalsPending ??= siteTotals((q) => prisma.$queryRaw(q))
    .then((data) => {
      g.visitTotals = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      g.visitTotalsPending = undefined;
    });
  return g.visitTotalsPending;
}

export async function GET() {
  try {
    const t = await load();
    return NextResponse.json(
      {
        success: true,
        data: {
          // หน้าบ้านแสดง "จำนวนครั้งที่เข้าเว็บไซต์ (รวมเข้าซ้ำ)"
          total: t.allTime.visits,
          thisYear: t.thisYear.visits,
          yearBE: t.thisYear.yearBE,
          since: t.since,
        },
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("[stats/visits]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
