import { NextRequest } from "next/server";
import { adminCreateProduct, adminListProducts } from "@/lib/services/admin.service";
import { jsonError } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const products = await adminListProducts();
    return Response.json({ products });
  } catch (error) {
    console.error(error);
    return jsonError("Mahsulotlar yuklanmadi", 500);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const product = await adminCreateProduct(body);
    return Response.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yaratilmadi";
    return jsonError(message, 400);
  }
}
