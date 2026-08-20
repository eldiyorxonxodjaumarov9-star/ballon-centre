import { NextResponse } from "next/server";
import { adminCookieName } from "@/lib/auth/admin";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", `${adminCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return response;
}
