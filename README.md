# ห้องสมุดกระทรวงมหาดไทย (Online Library)

ระบบห้องสมุดออนไลน์สำหรับเผยแพร่หนังสือและเอกสารวิชาการของกระทรวงมหาดไทย
ให้ประชาชนและข้าราชการค้นหาและอ่าน e-book ได้ทุกที่ทุกเวลา และมีหลังบ้านสำหรับผู้ดูแลระบบ
ไว้จัดการหนังสือ หมวดหมู่ และดูสถิติการใช้งาน

**Stack:** TypeScript · Next.js 15 (App Router) · Prisma 6 + PostgreSQL · Tailwind CSS v4 + shadcn/ui · pnpm workspaces + Turborepo · Supabase Storage · Redis/BullMQ (ไม่บังคับ)

---

## 1. วัตถุประสงค์

1. **เผยแพร่องค์ความรู้ของกระทรวงมหาดไทย**: รวมหนังสือ เอกสารวิชาการ และสิ่งพิมพ์ของหน่วยงานไว้ในที่เดียว
   เปิดอ่านออนไลน์ได้ฟรีทั้งบนคอมพิวเตอร์ แท็บเล็ต และมือถือ
2. **ค้นหาและเลือกหนังสือได้ง่าย**: ค้นจากชื่อเรื่อง ผู้แต่ง สำนักพิมพ์ หรือเลขทะเบียน
   และกรองตามหมวดหมู่ หมวด DDC ประเภทไฟล์ สำนักพิมพ์ จังหวัด และปีที่พิมพ์
3. **ประสบการณ์การอ่านที่ต่อเนื่อง**: อ่านแบบพลิกหน้า จำหน้าที่อ่านค้าง บุ๊กมาร์ก และ "อ่านต่อ" ในหน้าแรก
   (เก็บในเบราว์เซอร์ ไม่ต้องสมัครสมาชิก)
4. **ให้ผู้ดูแลจัดการคลังหนังสือเองได้**: เพิ่ม แก้ไข และลบหนังสือ อัปโหลดไฟล์และปก จัดการหมวดหมู่
5. **วัดผลการใช้งานเพื่อวางแผน**: dashboard แสดงผู้เข้าชม การอ่าน หนังสือยอดนิยม สถิติรายหมวดหมู่
   ช่วงเวลาที่มีคนใช้งาน และเลือกดูได้ตามช่วงเวลา (รวมถึงปีงบประมาณ)
   โดย**ไม่เก็บข้อมูลส่วนบุคคล** (ไม่เก็บ IP / ชื่อ / อีเมล)

### ความสามารถหลัก

| ส่วน                       | รายละเอียด                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| หน้าแรก `/`                | Hero, อ่านต่อ, บุ๊กมาร์ก, ชั้นหนังสือแนะนำ                                               |
| หนังสือทั้งหมด `/books`    | ค้นหา + ตัวกรองหลายแบบ (เก็บใน URL), มุมมองตาราง/การ์ด, แบ่งหน้า                         |
| รายละเอียด `/books/[slug]` | ข้อมูลบรรณานุกรม, คำอธิบาย (Markdown), หนังสือที่เกี่ยวข้อง, แชร์                        |
| อ่านหนังสือ `/read/[slug]` | PDF แบบพลิกหน้า, ซูม/ปัด/แตะเปลี่ยนหน้า, รองรับ iPhone รุ่นเก่า (pdf.js legacy)          |
| เกี่ยวกับเรา `/about`      | ประวัติหน่วยงานและพันธกิจ แบบ parallax                                                   |
| Footer                     | ข้อมูลติดต่อ, แผนที่, ตัวนับการเข้าชมเว็บไซต์ (ทั้งหมด / ปีนี้)                          |
| Dashboard `/dashboard`     | ภาพรวมและสถิติ, จัดการหนังสือ `/dashboard/books`, จัดการหมวดหมู่ `/dashboard/categories` |

---

## 2. การติดตั้ง

### สิ่งที่ต้องมี

- **Node.js 20 ขึ้นไป** (แนะนำ 22 LTS)
- **pnpm 9** → `corepack enable` (โปรเจคระบุ `pnpm@9.15.4` ไว้แล้ว)
- **Docker** สำหรับรัน PostgreSQL ในเครื่อง (หรือใช้ PostgreSQL ที่มีอยู่แล้วก็ได้)

### ขั้นตอน

```bash
# 1) ติดตั้งแพ็กเกจ (จะ generate Prisma Client ให้อัตโนมัติ)
pnpm install

# 2) สร้างไฟล์ตั้งค่า แล้วแก้ค่าตามตารางด้านล่าง
cp .env.example .env

# 3) เปิดฐานข้อมูล
docker compose up -d postgres

# 4) สร้างตารางทั้งหมดจาก migrations
pnpm --filter @repo/db migrate:deploy

# 5) (ไม่บังคับ) ใส่หนังสือตัวอย่างจาก packages/db/prisma/seed/data/*.json
#    (เป็นข้อมูลตัวอย่าง ถ้าจะนำเข้าข้อมูลจริงให้แก้ไฟล์ JSON และ seed/index.ts ก่อน)
pnpm db:seed

# 6) รันเว็บ
pnpm --filter online-library-web dev
```

- หน้าบ้าน: http://localhost:3000
- หลังบ้าน: http://localhost:3000/login (ชื่อผู้ใช้ `ADMIN_USERNAME` / รหัสผ่าน `ADMIN_PASSWORD`)

### ตัวแปรใน `.env`

| ตัวแปร                      | จำเป็น     | คำอธิบาย                                                                |
| --------------------------- | ---------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`              | ✅         | PostgreSQL ค่าใน `.env.example` ใช้กับ `docker compose` ได้ทันที        |
| `ADMIN_USERNAME`            | –          | ชื่อผู้ใช้หลังบ้าน (ค่าเริ่มต้น `admin`)                                |
| `ADMIN_PASSWORD`            | ✅         | รหัสผ่านเข้าหลังบ้าน                                                    |
| `AUTH_SECRET`               | ✅         | ค่าสุ่มสำหรับ session สร้างด้วย `openssl rand -base64 32`               |
| `SUPABASE_URL`              | production | URL ของโปรเจค Supabase (ที่เก็บไฟล์หนังสือและรูปปก)                     |
| `SUPABASE_SERVICE_ROLE_KEY` | production | Secret key ของ Supabase (`sb_secret_...`) **ห้าม commit / ห้ามเปิดเผย** |
| `SUPABASE_BUCKET`           | –          | ชื่อ bucket (ค่าเริ่มต้น `library-files`)                               |
| `STORAGE_DRIVER`            | –          | บังคับที่เก็บไฟล์: `local` หรือ `supabase` (ปกติเลือกอัตโนมัติ)         |
| `REDIS_URL`                 | –          | ใช้เมื่อรัน worker เท่านั้น ถ้าไม่ใช้ worker **ให้ลบหรือคอมเมนต์ออก**   |

> **ที่เก็บไฟล์:** ถ้าไม่ได้ตั้งค่า Supabase ระบบจะเก็บไฟล์อัปโหลดไว้ที่ `apps/web/public/uploads` (ใช้ได้เฉพาะตอนพัฒนาในเครื่อง)
> บน production ต้องตั้งค่า Supabase เสมอ

### โหมดสถิติ: มีหรือไม่มี Redis

| โหมด                       | ใช้เมื่อ                         | วิธีรัน                                                                                                       |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ไม่มี Redis** (ค่าแนะนำ) | ผู้ใช้หลักร้อยถึงหลักพันคนต่อวัน | ไม่ตั้ง `REDIS_URL` → รัน `pnpm --filter online-library-web dev` แล้ว event จะถูกเขียนลงฐานข้อมูลโดยตรง       |
| **มี Redis + worker**      | ผู้ใช้จำนวนมาก                   | ตั้ง `REDIS_URL` → `docker compose up -d` (เปิดทั้ง Postgres และ Redis) → `pnpm dev` (รันทั้ง web และ worker) |

> ถ้าตั้ง `REDIS_URL` และเปิด Redis แต่ไม่ได้รัน worker ข้อมูลการอ่านจะค้างอยู่ใน Redis และไม่ถูกบันทึกลงฐานข้อมูล

### คำสั่งที่ใช้บ่อย

| คำสั่ง                                   | ทำอะไร                                      |
| ---------------------------------------- | ------------------------------------------- |
| `pnpm --filter online-library-web dev`   | รันเฉพาะเว็บ (พอร์ต 3000)                   |
| `pnpm dev`                               | รันเว็บ + worker พร้อมกัน (ต้องมี Redis)    |
| `pnpm typecheck`                         | ตรวจ TypeScript ทุกแพ็กเกจ                  |
| `pnpm --filter online-library-web build` | build production                            |
| `pnpm --filter @repo/db migrate:deploy`  | ใช้ migration ที่ยังไม่ได้รันกับฐานข้อมูล   |
| `pnpm --filter @repo/db migrate:create`  | สร้าง migration ใหม่หลังแก้ `schema.prisma` |
| `pnpm db:generate`                       | สร้าง Prisma Client ใหม่ (หลังแก้ schema)   |
| `pnpm db:studio`                         | เปิด Prisma Studio ดู/แก้ข้อมูลในฐานข้อมูล  |
| `docker compose down`                    | ปิด Postgres/Redis (ข้อมูลยังอยู่ใน volume) |

### ปัญหาที่พบบ่อย

- **`P1001: Can't reach database server at localhost:5432`**: ยังไม่ได้เปิด Postgres ให้รัน `docker compose up -d postgres`
- **TypeScript ไม่รู้จัก model ใหม่ เช่น `Property 'pageView' does not exist`**: ให้รัน `pnpm db:generate`
  แล้วใน VS Code เลือก _TypeScript: Restart TS Server_ (ถ้า generate ขึ้น EPERM ให้หยุด `pnpm dev` ก่อน)
- **อัปโหลดไฟล์แล้วขึ้น `fetch failed`**: ค่า Supabase ใน `.env` ใช้งานไม่ได้ (เช่นโปรเจคถูก pause)
  ถ้าพัฒนาในเครื่อง ให้ตั้ง `STORAGE_DRIVER="local"`
- **`REDIS_URL is required` ตอน `pnpm dev`**: worker ต้องใช้ Redis ให้รันเฉพาะเว็บแทน (ดูโหมดสถิติด้านบน)

### ขึ้น production (Render)

1. Web Service ใช้ Runtime **Node** และตั้ง env ตามตารางด้านบนให้ครบ โดย `DATABASE_URL` ใช้ Internal URL ของ Render Postgres
2. **ไม่ต้อง**ใส่ `prisma migrate deploy` ใน Build Command ให้รัน migration จากเครื่องตัวเองก่อน deploy ทุกครั้งที่มี migration ใหม่
   ```bash
   cd packages/db
   DATABASE_URL="<External Database URL ของ Render>" npx prisma migrate status
   DATABASE_URL="<External Database URL ของ Render>" npx prisma migrate deploy
   ```
3. ไม่ต้องตั้ง `REDIS_URL` ถ้าไม่ได้สร้าง Background Worker

> มี `Dockerfile.web` (Next.js standalone) ไว้สำหรับกรณีเปลี่ยนไป deploy แบบ Docker

---

## 3. โครงสร้าง

```
online-library/
├── apps/
│   ├── web/                      Next.js — เว็บไซต์ทั้งหน้าบ้านและหลังบ้าน
│   │   ├── app/
│   │   │   ├── (public)/         หน้าบ้าน: หน้าแรก, /books, /books/[slug], /about (+ layout header/footer)
│   │   │   ├── (admin)/dashboard/ หลังบ้าน: ภาพรวมและสถิติ, books, categories
│   │   │   ├── read/[slug]/      หน้าอ่านหนังสือ (PDF flipbook เต็มจอ)
│   │   │   ├── login/            เข้าสู่ระบบผู้ดูแล
│   │   │   ├── api/              Route handlers (ดูตารางด้านล่าง)
│   │   │   └── layout.tsx        root layout + ตัวเก็บสถิติการเข้าชม (SiteTracker)
│   │   ├── components/           UI ของเว็บ
│   │   │   ├── about/            parallax ของหน้าเกี่ยวกับเรา
│   │   │   ├── books/            ส่วนประกอบหน้าหนังสือทั้งหมด/รายละเอียด (ตัวกรอง, การ์ด, ตาราง)
│   │   │   ├── dashboard/        dashboard สถิติ (กราฟ, ตัวกรองช่วงเวลา, ตาราง)
│   │   │   └── *.tsx             ชั้นหนังสือ, header/footer, modal จัดการหนังสือ ฯลฯ
│   │   ├── features/             logic แยกตามโดเมน
│   │   │   ├── books/            query/filters/actions ของหนังสือ
│   │   │   ├── categories/       query/actions ของหมวดหมู่
│   │   │   ├── library/          บุ๊กมาร์ก + ประวัติการอ่าน (localStorage)
│   │   │   ├── reader/           ตัวส่งสถิติการอ่าน (use-reading-tracker)
│   │   │   └── analytics/        ช่วงเวลา, query ของ dashboard, visitor id
│   │   ├── lib/                  auth, storage (Supabase/local), redis, pdf.js setup
│   │   ├── middleware.ts         ป้องกัน /dashboard และ API ที่เขียนข้อมูล
│   │   └── public/               ไฟล์ static, uploads (โหมด local)
│   └── worker/                   (ไม่บังคับ) ดึง event จาก Redis → DB, สรุปสถิติรายวันทุก 10 นาที
├── packages/
│   ├── db/                       Prisma: schema, migrations, seed, Prisma Client ที่ใช้ร่วมกัน
│   ├── analytics/                zod schema ของ event, SQL สรุปสถิติรายวัน
│   └── ui/                       shadcn/ui components + theme กลาง
├── docker-compose.yml            Postgres 16 + Redis 7 สำหรับพัฒนาในเครื่อง
├── Dockerfile.web                build เว็บแบบ standalone
├── turbo.json                    task pipeline ของ Turborepo
└── .env.example                  ตัวอย่างตัวแปรระบบ
```

### ตารางหลักในฐานข้อมูล (`packages/db/prisma/schema.prisma`)

| ตาราง                              | เก็บอะไร                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `Book`                             | หนังสือ: เลขทะเบียน, ชื่อ, ผู้แต่ง, สำนักพิมพ์, DDC, ไฟล์, ปก, สถานะเผยแพร่                   |
| `Category`, `BookCategory`         | หมวดหมู่ที่สร้างในระบบ และความสัมพันธ์กับหนังสือ (1 เล่มได้หลายหมวด)                          |
| `PageView`                         | การเปิดหน้าเว็บ 1 แถวต่อ 1 หน้า: ฝั่ง (หน้าบ้าน/หลังบ้าน), path, อุปกรณ์, ที่มา, หมวดที่เลือก |
| `ReadingEvent`                     | event การอ่าน: เปิด / heartbeat ทุก 30 วินาที / ปิด / อ่านจบ                                  |
| `BookStatsDaily`, `SiteStatsDaily` | ตารางสรุปรายวัน (worker เป็นคนเติม)                                                           |

### API

| Endpoint                                                         | สิทธิ์  | หน้าที่                                                                       |
| ---------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `GET /api/books`, `GET /api/books/[slug]`                        | สาธารณะ | ข้อมูลหนังสือที่เผยแพร่ (ค้นตาม slug หลายเล่มได้)                             |
| `POST/PUT/DELETE /api/books…`, `/api/categories…`, `/api/upload` | ผู้ดูแล | จัดการหนังสือ หมวดหมู่ และอัปโหลดไฟล์                                         |
| `POST /api/track/view`                                           | สาธารณะ | บันทึกการเปิดหน้าเว็บ (กรองบอทออก)                                            |
| `POST /api/track`                                                | สาธารณะ | บันทึก event การอ่าน                                                          |
| `GET /api/stats/visits`                                          | สาธารณะ | ตัวนับการเข้าชมใน footer (แคช 5 นาที)                                         |
| `GET /api/dashboard/stats`                                       | ผู้ดูแล | ข้อมูลทั้งหมดของ dashboard ตามช่วงเวลา `?range=30d&granularity=day&compare=1` |

### การไหลของข้อมูลสถิติ

```
เบราว์เซอร์ ── SiteTracker ──────▶ POST /api/track/view ──▶ PageView
           └─ หน้าอ่านหนังสือ ───▶ POST /api/track ──┬──▶ ReadingEvent          (ไม่มี Redis)
                                                  └──▶ Redis ──▶ worker ──▶ ReadingEvent

Dashboard ──▶ GET /api/dashboard/stats ──▶ คำนวณจาก PageView + ReadingEvent ตามช่วงเวลา (เวลาประเทศไทย)
```

- ผู้เข้าชมระบุด้วยรหัสสุ่มที่เก็บในเบราว์เซอร์ (`localStorage`) ไม่เก็บ IP หรือข้อมูลส่วนบุคคล
- การเข้าใช้ 1 ครั้ง (session) จะหมดอายุเมื่อไม่มีการใช้งานเกิน 30 นาที

---

## สิ่งที่วางแผนไว้ (TODO)

- เปลี่ยน login แบบรหัสผ่านเดียวเป็นบัญชีผู้ใช้รายบุคคล (เช่น Auth.js)
- Rate limit ที่ `/api/track` และ `/api/track/view`
- ย้ายไฟล์ PDF ใน `public/uploads` ขึ้น Supabase ทั้งหมด
- แทนข้อมูลติดต่อตัวอย่างใน footer (`FOOTER_CONTENT`) ด้วยข้อมูลจริง
- นโยบายเก็บข้อมูลสถิติย้อนหลัง (ลบ event ดิบที่เก่าเกินกำหนด)
