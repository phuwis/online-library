import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { areaOfPath, pageViewSchema } from "@repo/analytics/events";

/** bot / preview / เครื่องมือทดสอบ ไม่นับเป็นผู้เข้าชม */
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|pagespeed|headlesschrome|phantomjs|curl|wget|python-requests|axios|node-fetch/i;

/**
 * รับการเปิดหน้าเว็บ 1 ครั้งจาก SiteTracker
 * เขียนลง PageView ตรง ๆ (1 แถวต่อ 1 หน้า ปริมาณน้อยกว่า ReadingEvent มาก)
 * TODO: ใส่ rate limit ต่อ IP ถ้าเริ่มมีการยิงข้อมูลปลอม
 */
export async function POST(req: Request) {
  if (BOT_UA.test(req.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(await req.text());
  } catch {
    // ปล่อยให้ schema ตอบ 400
  }
  const parsed = pageViewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { path, visitorId, sessionId, device, referrer, category } =
    parsed.data;
  const cleanPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const cleanReferrer =
    referrer
      ?.toLowerCase()
      .replace(/^www\./, "")
      .replace(/[^a-z0-9.-]/g, "")
      .slice(0, 120) || null;

  try {
    // เปิดรายการหนังสือของหมวดหมู่ → เก็บ id ของหมวด (slug ที่ไม่มีอยู่จริงจะถูกละไว้)
    let categoryId: string | null = null;
    if (cleanPath === "/books" && category) {
      const found = await prisma.category.findUnique({
        where: { slug: category },
        select: { id: true },
      });
      categoryId = found?.id ?? null;
    }

    await prisma.pageView.create({
      data: {
        area: areaOfPath(cleanPath),
        path: cleanPath,
        visitorId,
        sessionId,
        device,
        referrer: cleanReferrer,
        categoryId,
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[track/view] insert failed:", err);
    return NextResponse.json({ error: "track failed" }, { status: 500 });
  }
}
