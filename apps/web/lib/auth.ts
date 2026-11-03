// Auth ชั่วคราวสำหรับ dashboard (รหัสผ่านเดียว) — ให้เปลี่ยนเป็น Auth.js ก่อนใช้งานจริง
// ใช้ Web Crypto เพื่อให้รันได้ทั้งใน middleware (edge) และ server action
export const SESSION_COOKIE = "admin_session";

export async function sessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || !password) return "";
  const data = new TextEncoder().encode(`${password}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
