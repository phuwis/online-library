"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th">
      <body style={{ fontFamily: "sans-serif", padding: 48, textAlign: "center" }}>
        <h2>ระบบขัดข้อง</h2>
        <button onClick={reset}>ลองใหม่</button>
      </body>
    </html>
  );
}
