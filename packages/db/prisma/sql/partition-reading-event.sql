-- ขั้นตอน (ทำครั้งเดียวตอนสร้าง migration แรก):
--
-- 1) pnpm --filter @repo/db migrate:create     ตั้งชื่อ migration เช่น "init"
-- 2) เปิดไฟล์ prisma/migrations/<timestamp>_init/migration.sql
-- 3) หา CREATE TABLE "ReadingEvent" (...) แล้วเปลี่ยนบรรทัดปิดท้ายจาก
--        );
--    เป็น
--        ) PARTITION BY RANGE ("occurredAt");
-- 4) ต่อท้ายไฟล์ migration ด้วย SQL ด้านล่าง
-- 5) pnpm db:migrate

-- partition สำรอง รับข้อมูลที่ตกนอกช่วงที่สร้างไว้
CREATE TABLE "ReadingEvent_default" PARTITION OF "ReadingEvent" DEFAULT;

-- partition รายเดือน (ปรับเดือนเริ่มต้นให้ตรงกับวันที่ใช้งานจริง)
-- worker จะสร้างเดือนถัดๆ ไปให้เองทุกวัน (apps/worker/src/jobs/ensure-partitions.ts)
CREATE TABLE "ReadingEvent_2026_10" PARTITION OF "ReadingEvent"
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE "ReadingEvent_2026_11" PARTITION OF "ReadingEvent"
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE "ReadingEvent_2026_12" PARTITION OF "ReadingEvent"
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
