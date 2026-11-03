import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { listPublishedBooks } from "@/features/books/queries";
import { BookGrid } from "@/components/book-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { items } = await listPublishedBooks({ take: 8 });
  return (
    <div className="space-y-12">
      <section className="space-y-4 py-6">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">อ่านหนังสือออนไลน์ได้ทุกที่</h1>
        <p className="max-w-xl text-lg text-muted-foreground">เลือกหนังสือที่สนใจ แล้วเริ่มอ่านได้ทันทีบนทุกอุปกรณ์</p>
        <Button asChild size="lg"><Link href="/books">ดูหนังสือทั้งหมด</Link></Button>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">เพิ่มเข้ามาล่าสุด</h2>
        <BookGrid books={items} />
      </section>
    </div>
  );
}
