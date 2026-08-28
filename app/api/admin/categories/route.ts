import { NextRequest } from "next/server";
import { jsonError, toApiErrorResponse } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createCategory, listAdminCategories } from "@/lib/services/category.service";
import { categoryCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const categories = await listAdminCategories();
    return Response.json({ categories });
  } catch (error) {
    console.error(error);
    return toApiErrorResponse(error, "Kategoriyalar yuklanmadi", 500);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const parsed = categoryCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Kategoriya ma'lumoti noto‘g‘ri");
    }
    const category = await createCategory(parsed.data);
    return Response.json({ category });
  } catch (error) {
    console.error(error);
    return toApiErrorResponse(error, "Kategoriya yaratilmadi", 400);
  }
}
