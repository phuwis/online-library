"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@repo/db";
import { slugify } from "@/lib/format";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().optional(),
});

export async function createCategory(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("ชื่อหมวดหมู่ไม่ถูกต้อง");
  const { name, slug } = parsed.data;
  await prisma.category.create({ data: { name, slug: slugify(slug || name) } });
  revalidatePath("/dashboard/categories");
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/dashboard/categories");
}
