import { NextRequest } from "next/server";
import { jsonError, toApiErrorResponse } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateCategory } from "@/lib/services/category.service";
import { categoryUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const parsed = categoryUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Kategoriya ma'lumoti noto‘g‘ri");
    }

    const category = await updateCategory(id, parsed.data);
    if (!category) return jsonError("Kategoriya topilmadi", 404);
    return Response.json({ category });
  } catch (error) {
    console.error(error);
    return toApiErrorResponse(error, "Kategoriya yangilanmadi", 400);
  }
}
