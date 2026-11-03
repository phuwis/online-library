import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string;
  slug: string;
  coverUrl: string | null;
  fileType: string;
}

export function BookGrid({ books }: { books: Book[] }) {
  if (!books || books.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="size-12 mx-auto mb-3 opacity-40" />
        <p>ยังไม่มีหนังสือในระบบ</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.slug}`}
          className="group bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
        >
          {/* ส่วนแสดงรูปปกหนังสือ หรือ Default Cover */}
          <div className="aspect-[3/4] w-full overflow-hidden bg-muted relative">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={book.title}
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              // Default Cover ดีไซน์ห้องสมุดราชการพรีเมียม (แสดงอัตโนมัติถ้าไม่มีรูปปก)
              <div className="size-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-primary/20 flex flex-col items-center justify-center p-6 text-center border border-border/40">
                <div className="p-3.5 rounded-full bg-primary/10 text-primary mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="size-8" />
                </div>
                <span className="text-xs font-semibold text-foreground line-clamp-2 px-1 tracking-wide">
                  {book.title}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1.5">
                  {book.author}
                </span>
              </div>
            )}

            {/* ป้ายบอกประเภทไฟล์ (PDF / EPUB) มุมบนขวา */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10">
              {book.fileType}
            </div>
          </div>

          {/* ส่วนข้อมูลรายละเอียดหนังสือใต้ภาพปก */}
          <div className="p-4 flex flex-col flex-grow justify-between space-y-2">
            <div>
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {book.author}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
