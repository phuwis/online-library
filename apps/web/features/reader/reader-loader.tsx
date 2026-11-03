"use client";

import dynamic from "next/dynamic";

// epub.js ใช้ window → โหลดฝั่ง client เท่านั้น
const EpubReader = dynamic(() => import("./epub-reader"), {
  ssr: false,
  loading: () => <p className="p-8 text-sm text-muted-foreground">กำลังโหลดหนังสือ…</p>,
});

export function ReaderLoader(props: { bookId: string; url: string }) {
  return <EpubReader {...props} />;
}
