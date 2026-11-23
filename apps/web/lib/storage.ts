import fs from "fs/promises";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ที่เก็บไฟล์ที่อัปโหลด (ไฟล์หนังสือ / รูปปก) — เลือกอัตโนมัติจาก env ไม่ต้องคอมเมนต์สลับโค้ดอีก
 *
 * - มี SUPABASE_URL (หรือ NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 *     → อัปโหลดขึ้น Supabase Storage (ใช้บน Render / production)
 * - ไม่มี → เขียนลง apps/web/public/uploads (ใช้ตอนพัฒนาในเครื่องเท่านั้น)
 * - บังคับเลือกเองได้ด้วย STORAGE_DRIVER="local" หรือ "supabase"
 *     (เช่น ในเครื่องมีค่า Supabase อยู่ใน .env แต่อยากเก็บไฟล์ในเครื่อง)
 *
 * production ห้ามใช้แบบ local: ดิสก์ของ Render ถูกล้างทุกครั้งที่ deploy/restart
 * และ Next.js เสิร์ฟเฉพาะไฟล์ใน public/ ที่มีตั้งแต่ตอน build
 */

const BUCKET = process.env.SUPABASE_BUCKET || "library-files";

// อ่านแบบ process.env[key] เพื่อไม่ให้ Next ฝังค่า NEXT_PUBLIC_* ตอน build (ค่าบน Render อาจยังไม่มีตอน build)
const env = (key: string) => process.env[key];

let client: SupabaseClient | null = null;

function supabaseUrl() {
  return env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
}

function supabase(): SupabaseClient | null {
  if (env("STORAGE_DRIVER") === "local") return null;
  const url = supabaseUrl();
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    if (env("STORAGE_DRIVER") === "supabase") {
      throw new Error(
        "STORAGE_DRIVER=supabase แต่ยังไม่ได้ตั้ง SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
      );
    }
    return null;
  }
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function storageMode(): "supabase" | "local" {
  return supabase() ? "supabase" : "local";
}

/** ไฟล์จาก FormData ที่มีเนื้อหาจริง (ช่องไฟล์ว่างจะเป็น File ขนาด 0) */
export function isUploadedFile(v: FormDataEntryValue | null): v is File {
  return !!v && typeof v === "object" && "size" in v && v.size > 0;
}

/**
 * บันทึกไฟล์แล้วคืน URL สำหรับเก็บลงฐานข้อมูล
 * @param baseName ชื่อไฟล์ไม่รวมนามสกุล เช่น "book-abc123-1700000000"
 */
export async function saveUpload(
  file: File,
  baseName: string,
  fallbackExt: string,
): Promise<string> {
  const ext = (path.extname(file.name) || fallbackExt).toLowerCase();
  const fileName = `${baseName}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const sb = supabase();
  if (sb) {
    const { data, error } = await sb.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type || undefined,
        upsert: false,
      });
    if (error) {
      // "fetch failed" = ต่อเซิร์ฟเวอร์ Supabase ไม่ได้เลย → บอกสาเหตุที่น่าจะเป็นให้ชัด
      const unreachable = /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(
        error.message,
      );
      const host = (() => {
        try {
          return new URL(supabaseUrl()!).host;
        } catch {
          return supabaseUrl();
        }
      })();
      throw new Error(
        unreachable
          ? `เชื่อมต่อ Supabase (${host}) ไม่ได้ — ตรวจว่า URL ถูกต้อง และ project ไม่ได้ถูก pause ` +
              `(ถ้าจะเก็บไฟล์ในเครื่องแทน ให้ตั้ง STORAGE_DRIVER="local" ใน .env)`
          : `อัปโหลดไฟล์ไม่สำเร็จ (${fileName}): ${error.message}` +
              (/bucket not found/i.test(error.message)
                ? ` — สร้าง bucket "${BUCKET}" บน Supabase ก่อน`
                : ""),
      );
    }
    return sb.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ยังไม่ได้ตั้งค่า Supabase Storage (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — production อัปโหลดลงดิสก์ไม่ได้",
    );
  }

  const dir = path.resolve(process.cwd(), "public/uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), buffer);
  return `/uploads/${fileName}`;
}
