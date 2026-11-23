import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

/**
 * ต้องล็อกอินแอดมินก่อน:
 * - หน้า /dashboard/*
 * - API ที่แก้ไขข้อมูล (POST/PUT/PATCH/DELETE) ของหนังสือ หมวดหมู่ และการอัปโหลด
 * - API สถิติของ dashboard
 * API ที่หน้าบ้านใช้อ่านข้อมูล (GET /api/books, /api/books/[slug], /api/categories) ยังเปิดสาธารณะ
 */
const READ_ONLY = new Set(["GET", "HEAD", "OPTIONS"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // API อ่านอย่างเดียวของหน้าบ้าน: ผ่านได้เลย
  const publicRead =
    isApi &&
    READ_ONLY.has(req.method) &&
    (pathname.startsWith("/api/books") || pathname === "/api/categories");
  if (publicRead) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const expected = await sessionToken();
  if (token && expected && token === expected) return NextResponse.next();

  if (isApi) {
    return NextResponse.json(
      { success: false, error: "กรุณาเข้าสู่ระบบผู้ดูแลก่อน" },
      { status: 401 },
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/books/:path*",
    "/api/categories/:path*",
    "/api/upload",
    "/api/dashboard/:path*",
  ],
};
