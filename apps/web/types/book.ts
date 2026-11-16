export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Book {
  id: string;
  bookCode: string | null; // 🌟 รหัสหนังสือ Auto-gen รูปแบบ ddc-YYYYMMDD-XXXXX (Required, Unique)
  title: string;
  author: string | null;
  slug: string; // 🌟 สุ่มอัตโนมัติด้วยระบบ ไม่เปิดให้แก้
  description?: string | null; // 🌟 รายละเอียดหนังสือ / รองรับ Markdown ในอนาคต

  fileUrl: string;
  coverUrl?: string | null;
  fileType: "PDF" | "EPUB" | string; // ปรับให้รองรับ Enum หรือ String ทั่วไป
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;

  publishedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  categories?: any[]; // รองรับข้อมูลความสัมพันธ์หมวดหมู่ (BookCategory)

  // ข้อมูลบรรณานุกรม (Bibliographic Metadata)
  publisher?: string | null;
  publicationInfo?: string | null;
  pageCount?: string | null;
  publishingProvince?: string | null;
  ddc?:
    | "GENERAL_000"
    | "PHILOSOPHY_100"
    | "RELIGION_200"
    | "SOCIAL_SCIENCES_300"
    | "LANGUAGES_400"
    | "SCIENCE_500"
    | "TECHNOLOGY_600"
    | "ARTS_700"
    | "LITERATURE_800"
    | "HISTORY_900"
    | string; // รองรับ Enum DDC ของระบบ
}
