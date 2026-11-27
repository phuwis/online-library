import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = {
  title: "ภาพรวมและสถิติ | ห้องสมุดกระทรวงมหาดไทย",
};

// ตัวกรองช่วงเวลาเก็บใน URL (?range=30d&granularity=day&compare=1) → แชร์ลิงก์/รีเฟรชแล้วได้มุมมองเดิม
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
