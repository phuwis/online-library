# Online Library

ห้องสมุดออนไลน์: หน้าบ้านอ่าน e-book, dashboard จัดการหนังสือ/หมวดหมู่ และสถิติการอ่านรายเล่ม
Stack: TypeScript · Next.js (App Router) · Prisma + PostgreSQL · shadcn/ui (Tailwind v4) · pnpm + Turborepo

> ⚠️ โค้ดชุดนี้เป็น scaffold ที่ยังไม่เคยถูก `install`/รันจริง (สร้างในสภาพแวดล้อมที่ไม่มีเครือข่าย)
> เมื่อรันครั้งแรกอาจเจอ type error หรือเวอร์ชันแพ็กเกจเล็กน้อย ให้ไล่แก้ด้วย `pnpm typecheck`

## โครงสร้าง

```
apps/
  web/        Next.js: (public) หน้าบ้าน+reader · (admin)/dashboard · login · api/track
  worker/     Node: ดึง event จาก Redis → batch insert, aggregate รายวัน, สร้าง partition
packages/
  db/         Prisma schema, client, seed (นำเข้า JSON เดิม)
  ui/         shadcn components + theme (ใช้ร่วมกัน)
  analytics/  zod schema ของ event, SQL aggregate, query ฝั่ง dashboard
```

## เริ่มต้นใช้งาน

```bash
pnpm install
cp .env.example .env            # แก้ ADMIN_PASSWORD / AUTH_SECRET
pnpm infra:up                   # Postgres + Redis ด้วย docker compose
```

### Migration + Partition ReadingEvent (ทำครั้งเดียว)

`ReadingEvent` โตเร็วที่สุด จึงต้อง partition รายเดือน Prisma ไม่จัดการ partition ให้ ต้องแก้ migration เอง:

1. `pnpm --filter @repo/db migrate:create` (ตั้งชื่อ `init`)
2. ทำตามคำอธิบายใน `packages/db/prisma/sql/partition-reading-event.sql`
   (เติม `PARTITION BY RANGE ("occurredAt")` ท้าย `CREATE TABLE "ReadingEvent"` แล้วต่อ SQL ท้ายไฟล์)
3. `pnpm db:migrate`

### นำเข้าข้อมูลเดิม (แทนโฟลเดอร์ `data/`)

วางไฟล์ JSON เดิมไว้ที่ `packages/db/prisma/seed/data/` แล้วปรับ `prisma/seed/index.ts` ให้ตรงกับ field จริง จากนั้น `pnpm db:seed`
(ไฟล์ตัวอย่างในนั้นเป็นแค่ placeholder) JSON ใช้เป็นข้อมูลตั้งต้นสำหรับ import เท่านั้น ระบบไม่อ่านมันตอนรัน

### รัน

```bash
pnpm dev     # web :3000 และ worker พร้อมกัน
```

- หน้าบ้าน: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard (รหัสผ่านตาม `ADMIN_PASSWORD`)

## การไหลของข้อมูลการอ่าน

```
Reader ──POST /api/track──▶ Redis list ──▶ worker (lpop 500 → createMany) ──▶ ReadingEvent (partitioned)
                                                      │ ทุก 10 นาที (BullMQ)
                                                      ▼
                                   BookStatsDaily / SiteStatsDaily ◀── Dashboard อ่านเฉพาะตารางนี้
```

กฎ: dashboard ห้าม query ตาราง `ReadingEvent` ตรงๆ, request ห้ามเขียน event ลง DB ตรงๆ

## Deploy

ไม่มี `deploy-package/` แล้ว ใช้ `output: "standalone"` + Docker:

```bash
pnpm install                        # สร้าง pnpm-lock.yaml (ต้อง commit)
docker build -f Dockerfile.web -t library-web .
```

Worker รันด้วย `pnpm --filter worker start` (ทำ Dockerfile.worker เพิ่มตามต้องการ)
รัน migration บน production ด้วย `pnpm --filter @repo/db migrate:deploy`

## สิ่งที่ยังเป็น TODO

- เปลี่ยน login รหัสผ่านเดียวเป็น Auth.js และผูก `userId` ใน `/api/track` + ตาราง `ReadingProgress` (resume จุดที่อ่านค้าง)
- Rate limit `/api/track`
- อัปโหลดไฟล์ผ่าน presigned URL (S3/R2) + signed URL ตอนอ่าน, PDF reader
- กราฟแนวโน้ม (shadcn chart), สถิติ drop-off ราย 10% ของเล่ม
- Search engine แยก (Meilisearch/Typesense) เมื่อหนังสือเยอะ, cache ผลสรุป dashboard
- Retention: drop partition เก่าของ `ReadingEvent` ตามนโยบาย
