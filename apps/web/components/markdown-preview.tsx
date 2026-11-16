"use client";

import ReactMarkdown from "react-markdown";
import { Eye, Code } from "lucide-react";
import { useState } from "react";
import { Button } from "@repo/ui/components/button";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({
  content,
  className = "",
}: MarkdownPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  return (
    <div
      className={`border border-border/70 rounded-xl overflow-hidden bg-card/50 ${className}`}
    >
      {/* Tab Header สำหรับสลับมุมมอง */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/60">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          ตัวอย่างการแสดงผล (Preview)
        </span>
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border/50">
          <Button
            type="button"
            variant={activeTab === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1"
            onClick={() => setActiveTab("preview")}
          >
            <Eye className="size-3.5" /> แสดงผล
          </Button>
          <Button
            type="button"
            variant={activeTab === "raw" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1"
            onClick={() => setActiveTab("raw")}
          >
            <Code className="size-3.5" /> โค้ดดิบ
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 min-h-[160px] max-h-[350px] overflow-y-auto text-left">
        {activeTab === "preview" ? (
          content.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic text-center py-6">
              ยังไม่มีข้อความสำหรับแสดงตัวอย่าง...
            </p>
          )
        ) : (
          <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40">
            {content || "ยังไม่มีข้อมูล..."}
          </pre>
        )}
      </div>
    </div>
  );
}
