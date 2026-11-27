-- สถิติการเข้าใช้งานเว็บไซต์ (หน้าบ้าน/หลังบ้าน) + จำนวนผู้อ่าน

-- CreateEnum
CREATE TYPE "SiteArea" AS ENUM ('PUBLIC', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP');

-- AlterTable
ALTER TABLE "ReadingEvent" ADD COLUMN "visitorId" TEXT;

-- CreateTable
CREATE TABLE "PageView" (
    "id" BIGSERIAL NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "area" "SiteArea" NOT NULL,
    "path" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "referrer" TEXT,
    "device" "DeviceType" NOT NULL,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingEvent_occurredAt_idx" ON "ReadingEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "PageView_occurredAt_idx" ON "PageView"("occurredAt");

-- CreateIndex
CREATE INDEX "PageView_area_occurredAt_idx" ON "PageView"("area", "occurredAt");

-- CreateIndex
CREATE INDEX "PageView_visitorId_occurredAt_idx" ON "PageView"("visitorId", "occurredAt");