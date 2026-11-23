"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@repo/db";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

// หมายเหตุ: การเพิ่ม/แก้ไขหนังสือย้ายไปใช้ API แล้ว
//   POST /api/books        (app/api/books/route.ts)  — สร้าง bookCode / slug / อัปโหลดไฟล์
//   PUT  /api/books/[slug] (app/api/books/[slug]/route.ts)
// createBook เดิมถูกลบออก เพราะไม่มีที่ใช้และไม่ได้สร้าง bookCode (ทำให้ `next build` ล้ม)

/** server action เรียกได้จากภายนอกเสมอ → ต้องเช็กสิทธิ์ในตัว action เอง */
async function assertAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const expected = await sessionToken();
  if (!token || !expected || token !== expected)
    throw new Error("ไม่มีสิทธิ์ดำเนินการ");
}

export async function deleteBook(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.book.delete({ where: { id } });
  revalidatePath("/dashboard/books");
}
