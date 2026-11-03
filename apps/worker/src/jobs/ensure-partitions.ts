import { prisma } from "@repo/db";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** สร้าง partition รายเดือนของ ReadingEvent ล่วงหน้า (ต้องทำตามขั้นตอน partition ใน README ก่อน) */
export async function ensureReadingEventPartitions(monthsAhead = 3) {
  const now = new Date();
  for (let i = 0; i <= monthsAhead; i++) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i + 1, 1));
    const name = `ReadingEvent_${start.getUTCFullYear()}_${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
    try {
      // ชื่อและวันที่สร้างจากโค้ดเอง ไม่มี input จากภายนอก
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "${name}" PARTITION OF "ReadingEvent" FOR VALUES FROM ('${iso(start)}') TO ('${iso(end)}')`,
      );
    } catch (e) {
      console.warn(`[partitions] skip ${name}:`, (e as Error).message);
    }
  }
}
