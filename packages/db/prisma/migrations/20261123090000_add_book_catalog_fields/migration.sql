-- เพิ่มข้อมูลบรรณานุกรมของหนังสือ (รหัสหนังสือ, หมวด DDC, สำนักพิมพ์ ฯลฯ)
-- ให้ตรงกับ prisma/schema.prisma ปัจจุบัน
-- ปลอดภัยกับฐานข้อมูลที่มีหนังสืออยู่แล้ว: เล่มเดิมจะได้ bookCode อัตโนมัติ

-- CreateEnum
CREATE TYPE "DdcCategory" AS ENUM ('GENERAL_000', 'PHILOSOPHY_100', 'RELIGION_200', 'SOCIAL_SCIENCES_300', 'LANGUAGE_400', 'SCIENCE_500', 'TECHNOLOGY_600', 'ARTS_RECREATION_700', 'LITERATURE_800', 'HISTORY_GEOGRAPHY_900');

-- AlterTable
ALTER TABLE "Book"
  ADD COLUMN "bookCode" TEXT,
  ADD COLUMN "publisher" TEXT,
  ADD COLUMN "publicationInfo" TEXT,
  ADD COLUMN "publishingProvince" TEXT,
  ADD COLUMN "ddc" "DdcCategory" NOT NULL DEFAULT 'GENERAL_000',
  ALTER COLUMN "pageCount" SET DATA TYPE TEXT;

-- เติม bookCode ให้หนังสือเดิม: รูปแบบเดียวกับระบบ  000-YYYYMMDD-00001 (เรียงตามเวลาสร้างในแต่ละวัน)
WITH numbered AS (
  SELECT "id",
         '000-' || to_char("createdAt", 'YYYYMMDD') || '-' ||
         lpad(row_number() OVER (PARTITION BY "createdAt"::date ORDER BY "createdAt", "id")::text, 5, '0') AS code
  FROM "Book"
  WHERE "bookCode" IS NULL
)
UPDATE "Book" b SET "bookCode" = n.code FROM numbered n WHERE b."id" = n."id";

ALTER TABLE "Book" ALTER COLUMN "bookCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Book_bookCode_key" ON "Book"("bookCode");

-- CreateIndex
CREATE INDEX "Book_ddc_idx" ON "Book"("ddc");

-- CreateIndex
CREATE INDEX "Book_bookCode_idx" ON "Book"("bookCode");

-- CreateIndex
CREATE INDEX "Book_slug_idx" ON "Book"("slug");