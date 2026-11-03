import { BookOpen } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <BookOpen className="size-6" />
          <CardTitle className="text-xl">เข้าสู่ระบบจัดการ</CardTitle>
          <CardDescription>กรอกรหัสผ่านผู้ดูแลเพื่อดำเนินการต่อ</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" name="password" type="password" required autoFocus aria-invalid={!!error} />
              {error && <p className="text-sm text-destructive">รหัสผ่านไม่ถูกต้อง</p>}
            </div>
            <Button type="submit" className="w-full">เข้าสู่ระบบ</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
