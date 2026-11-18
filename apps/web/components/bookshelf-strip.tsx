/**
 * แถบชั้นหนังสือ (สันหนังสือเรียงยาว) วาดด้วย SVG — ไม่ต้องโหลดไฟล์ภาพ
 * ใช้เป็นลายพื้นหลังจางๆ ของ header / footer
 * สุ่มแบบกำหนด seed (deterministic) → server กับ client ได้ภาพเดียวกัน ไม่เกิด hydration mismatch
 */

const PALETTE = [
  "#581c87", // purple-900
  "#6b21a8", // purple-800
  "#7e22ce", // purple-700
  "#4c1d95", // violet-900
  "#5b21b6", // violet-800
  "#3730a3", // indigo-800
  "#312e81", // indigo-900
  "#86198f", // fuchsia-800
  "#a16207", // ทองหม่น (แต้มเล็กน้อย)
];

const VIEW_W = 2400;
const VIEW_H = 64;

type Spine = {
  x: number;
  w: number;
  h: number;
  color: string;
  tilt: number;
  bands: number[];
};

function makeSpines(seed: number): Spine[] {
  // LCG แบบง่าย
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const spines: Spine[] = [];
  let x = 4;
  while (x < VIEW_W) {
    // เว้นช่องว่างเป็นระยะ (เหมือนชั้นที่ไม่ได้อัดแน่น)
    if (rand() < 0.06) {
      x += 10 + rand() * 18;
      continue;
    }
    const w = 7 + Math.round(rand() * 14);
    const h = 34 + Math.round(rand() * 24);
    // เล่มเอียงพิงเป็นครั้งคราว
    const tilt = rand() < 0.07 ? (rand() < 0.5 ? -1 : 1) * (6 + rand() * 8) : 0;
    const bandCount = rand() < 0.75 ? 1 + Math.floor(rand() * 2) : 0;
    const bands = Array.from({ length: bandCount }, () => 0.15 + rand() * 0.6);
    spines.push({
      x,
      w,
      h,
      color: PALETTE[Math.floor(rand() * PALETTE.length)]!,
      tilt,
      bands,
    });
    x += w + 1 + (tilt !== 0 ? 6 : 0);
  }
  return spines;
}

export function BookshelfStrip({
  className = "",
  seed = 7,
}: {
  className?: string;
  seed?: number;
}) {
  const spines = makeSpines(seed);
  const base = VIEW_H - 4; // ระดับไม้กระดาน

  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMinYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {spines.map((b, i) => {
        const y = base - b.h;
        const transform = b.tilt
          ? `rotate(${b.tilt.toFixed(1)} ${b.tilt > 0 ? b.x : b.x + b.w} ${base})`
          : undefined;
        return (
          <g key={i} transform={transform}>
            <rect
              x={b.x}
              y={y}
              width={b.w}
              height={b.h}
              rx={1.2}
              fill={b.color}
            />
            {/* แสงที่ขอบสัน */}
            <rect
              x={b.x + 1}
              y={y + 1}
              width={1.2}
              height={b.h - 2}
              fill="#ffffff"
              opacity={0.18}
            />
            {b.bands.map((p, j) => (
              <rect
                key={j}
                x={b.x + 1}
                y={y + b.h * p}
                width={b.w - 2}
                height={2}
                fill="#fde68a"
                opacity={0.55}
              />
            ))}
          </g>
        );
      })}
      {/* ไม้กระดาน */}
      <rect x={0} y={base} width={VIEW_W} height={4} fill="#3b0764" />
    </svg>
  );
}
