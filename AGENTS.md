# Conventions (ไฟล์กลางสำหรับ AI/คนในทีม)

- Monorepo: pnpm + Turborepo. แอป `apps/web` (Next.js), `apps/worker` (Node). แพ็กเกจร่วม `packages/*` ชื่อ `@repo/*`
- ข้อมูลทั้งหมดอยู่ใน PostgreSQL ผ่าน Prisma (`@repo/db`) — ห้ามเก็บข้อมูลธุรกิจเป็นไฟล์ JSON
- Dashboard อ่านสถิติจากตาราง aggregate (`BookStatsDaily`, `SiteStatsDaily`) เท่านั้น ห้าม groupBy บน `ReadingEvent`
- การเขียน event การอ่านต้องผ่าน Redis → worker (batch insert) ห้าม insert ตรงจาก request
- โค้ดแยกตามฟีเจอร์ใน `apps/web/features/*` (queries, actions, components). route handler ให้บาง
- UI ใช้ shadcn (`@repo/ui`) เพิ่ม component ผ่าน CLI หรือเขียนใน `packages/ui/src/components`
- List ทุกที่ใช้ cursor pagination
