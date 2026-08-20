import { NextRequest } from "next/server";
import { adminArchiveProduct, adminDeleteProduct, adminUpdateProduct } from "@/lib/services/admin.service";
import { jsonError } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.archive) {
      const product = await adminArchiveProduct(id);
      return Response.json({ product });
    }
    const product = await adminUpdateProduct(id, body);
    return Response.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yangilanmadi";
    return jsonError(message, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    await adminDeleteProduct(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError("O‘chirilmadi", 400);
  }
}
