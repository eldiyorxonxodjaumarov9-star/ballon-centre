import { NextRequest } from "next/server";
import { listAllOrders, updateOrderStatus } from "@/lib/services/order.service";
import { jsonError } from "@/lib/api/http";
import { orderStatusSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const orders = await listAllOrders();
    return Response.json({ orders });
  } catch (error) {
    console.error(error);
    return jsonError("Buyurtmalar yuklanmadi", 500);
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const parsed = orderStatusSchema.safeParse({ status: body.status });
    if (!parsed.success || !body.id) return jsonError("Status noto‘g‘ri");
    const order = await updateOrderStatus(body.id, parsed.data.status);
    if (!order) return jsonError("Buyurtma topilmadi", 404);
    return Response.json({ order });
  } catch (error) {
    console.error(error);
    return jsonError("Status yangilanmadi", 400);
  }
}
