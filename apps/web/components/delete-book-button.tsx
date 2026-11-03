"use client";
import { Button } from "@repo/ui/components/button";
import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function DeleteBookButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:bg-destructive/10"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("คุณต้องการลบหนังสือเล่มนี้ใช่หรือไม่?")) {
          e.preventDefault();
        }
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
