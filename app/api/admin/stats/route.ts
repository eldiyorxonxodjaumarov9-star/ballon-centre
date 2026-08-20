import { NextRequest } from "next/server";
import { adminStats } from "@/lib/services/admin.service";
import { jsonError } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const stats = await adminStats();
    return Response.json({ stats });
  } catch (error) {
    console.error(error);
    return jsonError("Statistika yuklanmadi", 500);
  }
}
