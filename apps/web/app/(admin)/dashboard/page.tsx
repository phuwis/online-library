import { CheckCircle2, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { getOverview, getTopBooks } from "@repo/analytics";
import { TrendBars } from "@/components/trend-bars";
import { formatDuration, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // อ่านจากตาราง aggregate เท่านั้น
  const [overview, top] = await Promise.all([getOverview(30), getTopBooks(30, 10)]);

  const stats = [
    { label: "ครั้งที่เปิดอ่าน", value: overview.totalSessions.toLocaleString(), icon: Eye },
    { label: "เวลาอ่านรวม", value: formatDuration(overview.totalSec), icon: Clock },
    { label: "เฉลี่ยต่อครั้ง", value: formatDuration(overview.avgSecPerSession), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ภาพรวมและสถิติการอ่าน</h1>
        <p className="text-sm text-muted-foreground">ข้อมูล 30 วันล่าสุด</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-semibold tracking-tight">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ครั้งที่เปิดอ่านรายวัน</CardTitle>
          <CardDescription>วางเมาส์บนแท่งเพื่อดูตัวเลข</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendBars label="จำนวนครั้งที่เปิดอ่านรายวัน" data={overview.series.map((s) => ({ date: s.date, value: s.sessions }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>หนังสือยอดนิยม</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อหนังสือ</TableHead>
                <TableHead>ครั้งที่เปิดอ่าน</TableHead>
                <TableHead>เวลาอ่านรวม</TableHead>
                <TableHead>อ่านจบ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">ยังไม่มีข้อมูลการอ่าน</TableCell></TableRow>
              )}
              {top.map((b) => (
                <TableRow key={b.bookId}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.sessions.toLocaleString()}</TableCell>
                  <TableCell>{formatDuration(b.totalSec)}</TableCell>
                  <TableCell>{formatPercent(b.finishRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
