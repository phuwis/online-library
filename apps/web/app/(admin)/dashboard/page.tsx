"use client";

import { useEffect, useState } from "react";
import { Loader2, Eye, Clock, BarChart3, BookOpen } from "lucide-react";

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

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard/stats");
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ภาพรวมและสถิติการอ่าน
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ข้อมูลสถิติการใช้งานระบบย้อนหลัง 30 วันล่าสุด
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: ครั้งที่เปิดอ่าน */}
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

        {/* Card 2: เวลาอ่านรวม */}
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

        {/* Card 3: เฉลี่ยต่อครั้ง */}
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
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            ครั้งที่เปิดอ่านรายวัน
          </h3>
          <p className="text-xs text-muted-foreground">
            แนวโน้มการเข้าใช้งานระบบในช่วง 30 วันที่ผ่านมา
          </p>
        </div>

        <div className="h-48 border border-dashed border-border/80 rounded-xl flex items-end p-4 gap-1 bg-muted/10 overflow-x-auto">
          {dailyStats.length === 0 ? (
            <div className="m-auto text-xs text-muted-foreground">
              ยังไม่มีข้อมูลสถิติรายวันในช่วงนี้
            </div>
          ) : (
            dailyStats.map((stat, index) => {
              // คำนวณความสูงแท่งกราฟเทียบกับค่าสูงสุด (ป้องกันหารด้วยศูนย์)
              const maxSessions = Math.max(
                ...dailyStats.map((s) => s.sessions),
                1,
              );
              const heightPercent = Math.max(
                (stat.sessions / maxSessions) * 100,
                8,
              );

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 group relative min-h-full justify-end"
                >
                  {/* Tooltip เมื่อเอาเมาส์วาง */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                    {new Date(stat.date).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                    : {stat.sessions} ครั้ง
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Books Table */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 bg-muted/20">
          <h3 className="font-semibold text-sm text-foreground">
            หนังสือยอดนิยม (Top Books)
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

// ฟังก์ชันช่วยเหลือแปลงวินาที
function formatTime(totalSec: number) {
  if (totalSec < 60) return `${totalSec} วินาที`;
  const minutes = Math.floor(totalSec / 60);
  if (minutes < 60) return `${minutes} นาที`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours} ชั่วโมง`;
}
