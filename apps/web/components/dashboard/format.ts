const nf = new Intl.NumberFormat("th-TH");
const nf1 = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });

export const fmtNumber = (n: number) => nf.format(Math.round(n));
export const fmtDecimal = (n: number) => nf1.format(n);
export const fmtPercent = (ratio: number) => `${nf1.format(ratio * 100)}%`;

/** วินาที → ข้อความสั้น เช่น "45 วินาที", "12 นาที", "3 ชม. 20 นาที", "1,240 ชม." */
export function fmtDuration(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s} วินาที`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} นาที`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h >= 100) return `${nf.format(h)} ชม.`;
  return rest ? `${h} ชม. ${rest} นาที` : `${h} ชม.`;
}

/** สำหรับแกนกราฟ (สั้นมาก) */
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${nf1.format(n / 1_000_000)}M`;
  if (n >= 10_000) return `${nf1.format(n / 1000)}K`;
  return nf.format(Math.round(n));
}

/** อัตราเปลี่ยนแปลงเทียบช่วงก่อนหน้า (null = เทียบไม่ได้) */
export function change(
  current: number,
  previous: number | null | undefined,
): number | null {
  if (previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

export const safeRatio = (a: number, b: number) => (b > 0 ? a / b : 0);
