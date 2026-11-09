import { toast } from "sonner"; // 🌟 ตรงนี้ใช้จาก 'sonner' อยู่แล้ว จะใช้งานได้ทันทีไม่มี Error ครับ

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const isMutating = ["POST", "PUT", "DELETE"].includes(method);

  try {
    const response = await fetch(input, init);

    if (isMutating) {
      if (response.ok) {
        if (method === "POST") toast.success("สร้างข้อมูลสำเร็จเรียบร้อย");
        if (method === "PUT") toast.success("อัปเดตข้อมูลสำเร็จเรียบร้อย");
        if (method === "DELETE") toast.success("ลบข้อมูลสำเร็จเรียบร้อย");
      } else {
        let errorMsg = "เกิดข้อผิดพลาดในการทำรายการ";
        try {
          const data = await response.clone().json();
          if (data.error) errorMsg = data.error;
        } catch (e) {}
        toast.error(errorMsg);
      }
    }

    return response;
  } catch (error) {
    if (isMutating) {
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
    throw error;
  }
}
