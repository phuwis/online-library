"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Eye,
  Clock,
  BarChart3,
  BookOpen,
  Calendar,
} from "lucide-react";

interface DashboardData {
  summary: {
    totalSessions: number;
    totalSeconds: number;
    avgSecondsPerSession: number;
  };
  dailyStats: Array<{
    date: string;
    sessions: number;
    totalSec: number;
  }>;
  topBooks: Array<{
    id: string;
    title: string;
    author: string;
    sessions: number;
    totalSec: number;
    finished: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7"); // 🌟 Default ที่ 7 วันล่าสุด

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/stats?days=${timeRange}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [timeRange]); // โหลดข้อมูลใหม่เมื่อเปลี่ยน timeRange

  const summary = data?.summary || {
    totalSessions: 0,
    totalSeconds: 0,
    avgSecondsPerSession: 0,
  };
  const topBooks = data?.topBooks || [];
  const dailyStats = data?.dailyStats || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ภาพรวมและสถิติการอ่าน
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ข้อมูลสถิติการใช้งานระบบย้อนหลัง {timeRange} วันล่าสุด
          </p>
        </div>

        {/* 🌟 Select สำหรับเปลี่ยนช่วงเวลา */}
        <div className="flex items-center gap-2 bg-card border border-border/80 px-3 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
          <Calendar className="size-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            ช่วงเวลา:
          </span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="7" className="bg-card text-foreground">
              7 วันล่าสุด
            </option>
            <option value="30" className="bg-card text-foreground">
              30 วันล่าสุด
            </option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">ครั้งที่เปิดอ่าน</span>
            <Eye className="size-5 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">
              {summary.totalSessions.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-2">ครั้ง</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">เวลาอ่านรวม</span>
            <Clock className="size-5 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">
              {formatTime(summary.totalSeconds)}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">เฉลี่ยต่อครั้ง</span>
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-foreground">
              {summary.avgSecondsPerSession}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              วินาที / ครั้ง
            </span>
          </div>
        </div>
      </div>

      {/* Chart / Daily Stats Section */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />{" "}
              ครั้งที่เปิดอ่านรายวัน ({timeRange} วันล่าสุด)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              แนวโน้มและจำนวนครั้งที่มีการเปิดอ่านหนังสือในระบบตามช่วงเวลาที่เลือก
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs bg-muted/30 px-3 py-1.5 rounded-lg border border-border/60 self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-primary inline-block" />
              <span className="text-muted-foreground font-medium">
                ความหมาย:{" "}
                <strong className="text-foreground">
                  จำนวนครั้ง (Sessions)
                </strong>
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-60 border border-dashed border-border/80 rounded-xl flex items-end px-4 py-4 gap-2 bg-muted/10 overflow-x-auto">
            {dailyStats.length === 0 ? (
              <div className="m-auto text-xs text-muted-foreground">
                ยังไม่มีข้อมูลสถิติรายวันในช่วงนี้
              </div>
            ) : (
              dailyStats.map((stat, index) => {
                const maxSessions = Math.max(
                  ...dailyStats.map((s) => s.sessions),
                  1,
                );
                const heightPx =
                  stat.sessions > 0
                    ? Math.max((stat.sessions / maxSessions) * 140, 16)
                    : 6;

                const dateObj = new Date(stat.date);
                const dayOfWeek = dateObj.toLocaleDateString("th-TH", {
                  weekday: "short",
                });
                const dayAndMonth = dateObj.toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                });

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1.5 group relative justify-end min-w-[36px] h-full"
                  >
                    <span className="text-[10px] font-bold text-foreground bg-background/80 px-1 rounded shadow-sm border border-border/40">
                      {stat.sessions}
                    </span>

                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground border border-border text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20">
                      <p className="font-semibold">
                        {dateObj.toLocaleDateString("th-TH", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-primary font-bold">
                        เปิดอ่าน: {stat.sessions} ครั้ง
                      </p>
                    </div>

                    <div
                      style={{ height: `${heightPx}px` }}
                      className={`w-full rounded-t-md transition-all cursor-pointer ${
                        stat.sessions > 0
                          ? "bg-primary/90 hover:bg-primary shadow-sm"
                          : "bg-muted-foreground/20"
                      }`}
                    />

                    <div className="flex flex-col items-center text-[10px] text-muted-foreground leading-tight pt-1">
                      <span className="font-bold text-foreground">
                        {dayOfWeek}
                      </span>
                      <span>{dayAndMonth}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Top Books Table */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 bg-muted/20">
          <h3 className="font-semibold text-sm text-foreground">
            หนังสือยอดนิยม (Top Books - {timeRange} วันล่าสุด)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-xs font-semibold text-muted-foreground bg-muted/30">
                <th className="px-6 py-3.5">ชื่อหนังสือ</th>
                <th className="px-6 py-3.5 text-center">ครั้งที่เปิดอ่าน</th>
                <th className="px-6 py-3.5 text-center">เวลาอ่านรวม</th>
                <th className="px-6 py-3.5 text-center">อ่านจบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {topBooks.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-muted-foreground"
                  >
                    ยังไม่มีข้อมูลการอ่าน
                  </td>
                </tr>
              ) : (
                topBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-muted/15 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                      <BookOpen className="size-4 text-primary shrink-0" />
                      <span className="truncate max-w-md">{book.title}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {book.sessions.toLocaleString()} ครั้ง
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-muted-foreground">
                      {formatTime(book.totalSec)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {book.finished} เล่ม
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatTime(totalSec: number) {
  if (totalSec < 60) return `${totalSec} วินาที`;
  const minutes = Math.floor(totalSec / 60);
  if (minutes < 60) return `${minutes} นาที`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours} ชั่วโมง`;
}
