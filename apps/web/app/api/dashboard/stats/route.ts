import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getDashboardData } from "@/features/analytics/dashboard-queries";
import { resolveRange } from "@/features/analytics/range";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/stats?range=30d&granularity=auto&compare=1
 *     /api/dashboard/stats?range=custom&from=2026-10-01&to=2026-11-26
 * (ต้องล็อกอินแอดมิน — ตรวจใน middleware)
 */
export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const range = resolveRange({
      range: sp.get("range"),
      from: sp.get("from"),
      to: sp.get("to"),
      granularity: sp.get("granularity"),
      compare: sp.get("compare"),
    });

    const data = await getDashboardData(range, (query) =>
      prisma.$queryRaw(query),
    );
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}
