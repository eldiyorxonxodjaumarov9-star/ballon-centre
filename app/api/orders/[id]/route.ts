import { NextRequest } from "next/server";
import { getOrderById } from "@/lib/services/order.service";
import { getUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/api/http";
import { isMockMode } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    const order = await getOrderById(id, isMockMode() ? undefined : user?.id);
    if (!order) return jsonError("Buyurtma topilmadi", 404);
    return Response.json({ order });
  } catch (error) {
    console.error(error);
    return jsonError("Buyurtma yuklanmadi", 500);
  }
}
