// กราฟแท่งรายวันแบบ CSS ล้วน (ไม่ต้องพึ่งไลบรารี) — เปลี่ยนเป็น shadcn chart ได้ภายหลัง
type Point = { date: string; value: number };

export function TrendBars({ data, label }: { data: Point[]; label: string }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูลในช่วงนี้</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div role="img" aria-label={label} className="flex h-40 items-end gap-1">
      {data.map((d) => (
        <div key={d.date} className="group flex h-full flex-1 items-end" title={`${d.date}: ${d.value.toLocaleString()}`}>
          <div
            className="w-full rounded-t-sm bg-chart-1 opacity-80 transition-opacity group-hover:opacity-100"
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
