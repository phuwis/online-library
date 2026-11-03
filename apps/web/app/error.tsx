"use client";

import { Button } from "@repo/ui/components/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
      <p className="text-sm text-muted-foreground">{error.digest ? `รหัสอ้างอิง: ${error.digest}` : "ลองโหลดหน้านี้ใหม่อีกครั้ง"}</p>
      <Button onClick={reset}>ลองใหม่</Button>
    </div>
  );
}
