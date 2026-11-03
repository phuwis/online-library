"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@repo/db";
import { slugify } from "@/lib/format";

const bookSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  author: z.string().trim().min(1),
  fileUrl: z.string().trim().min(1), // <--- เปลี่ยนจาก .url() เป็น .min(1) เพื่อรองรับ /uploads/...
  fileType: z.enum(["EPUB", "PDF"]).default("EPUB"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function createBook(formData: FormData) {
  const parsed = bookSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("ข้อมูลหนังสือไม่ถูกต้อง");
  const { slug, status, ...rest } = parsed.data;
  const categoryIds = formData.getAll("categoryIds").map(String);

  await prisma.book.create({
    data: {
      ...rest,
      status,
      slug: slug ? slugify(slug) : slugify(rest.title),
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });
  revalidatePath("/dashboard/books");
}

export async function deleteBook(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.book.delete({ where: { id } });
  revalidatePath("/dashboard/books");
}
