import { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth/admin";
import { jsonError } from "@/lib/api/http";

export async function requireAdmin(request: NextRequest) {
  if (await isAdminRequest(request)) return null;
  return jsonError("Admin ruxsati yo‘q", 401);
}
