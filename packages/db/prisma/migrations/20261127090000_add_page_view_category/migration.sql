-- สถิติการเข้าชมรายหมวดหมู่ของห้องสมุด (เปิดรายการหนังสือของหมวด /books?category=slug)

-- AlterTable
ALTER TABLE "PageView" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "PageView_categoryId_occurredAt_idx" ON "PageView"("categoryId", "occurredAt");