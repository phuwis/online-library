export function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h} ชม. ${m} นาที`;
  if (m > 0) return `${m} นาที`;
  return `${totalSec} วินาที`;
}

export function formatPercent(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export function slugify(input: string) {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // ชื่อภาษาไทยจะไม่เหลืออักขระ → สร้าง slug สุ่มแทน (หรือให้ผู้ใช้กรอก slug เอง)
  return s || `item-${Date.now().toString(36)}`;
}
