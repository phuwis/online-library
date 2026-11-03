import { Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { listCategories } from "@/features/categories/queries";
import { createCategory, deleteCategory } from "@/features/categories/actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">หมวดหมู่</h1>

      <Card>
        <CardHeader><CardTitle>เพิ่มหมวดหมู่</CardTitle></CardHeader>
        <CardContent>
          <form action={createCategory} className="flex flex-col gap-2 sm:flex-row">
            <Input name="name" placeholder="ชื่อหมวดหมู่" required />
            <Input name="slug" placeholder="slug (ไม่บังคับ)" />
            <Button type="submit">เพิ่ม</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>ชื่อ</TableHead><TableHead>slug</TableHead><TableHead>จำนวนหนังสือ</TableHead><TableHead className="w-12" /></TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">ยังไม่มีหมวดหมู่ เพิ่มหมวดแรกได้ด้านบน</TableCell></TableRow>
              )}
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell>{c._count.books}</TableCell>
                  <TableCell>
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="ghost" size="icon" type="submit" aria-label={`ลบ ${c.name}`}><Trash2 className="size-4" /></Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
