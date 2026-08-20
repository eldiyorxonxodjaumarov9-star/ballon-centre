import { NextRequest } from "next/server";
import { adminLoginSchema } from "@/lib/validations";
import { adminCookieName, createAdminToken, timingSafeEqual } from "@/lib/auth/admin";
import { jsonError } from "@/lib/api/http";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("998") && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return value.trim();
}

export async function POST(request: NextRequest) {
  if (!rateLimit(clientKey(request.headers.get("x-forwarded-for"), "admin-login"), 8, 60_000)) {
    return jsonError("Juda ko‘p urinish", 429);
  }

  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse({
      phone: normalizePhone(String(body.phone ?? "")),
      password: String(body.password ?? ""),
    });
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Ma'lumot noto‘g‘ri");

    const expectedPhone = normalizePhone(process.env.ADMIN_PHONE ?? "");
    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || "";
    if (!expectedPhone || !expectedPassword) {
      return jsonError("Admin login sozlanmagan", 500);
    }
    if (
      !timingSafeEqual(parsed.data.phone, expectedPhone) ||
      !timingSafeEqual(parsed.data.password, expectedPassword)
    ) {
      return jsonError("Telefon yoki parol noto‘g‘ri", 401);
    }

    const token = await createAdminToken();
    const response = Response.json({ ok: true });
    response.headers.append(
      "Set-Cookie",
      `${adminCookieName()}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}`,
    );
    return response;
  } catch (error) {
    console.error(error);
    return jsonError("Kirish xatosi", 500);
  }
}
