import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/http";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const MAX_SIZE = 6 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!rateLimit(clientKey(request.headers.get("x-forwarded-for"), "receipt"), 8, 60_000)) {
    return jsonError("Ko‘p so‘rov yuborildi. Biroz kuting.", 429);
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Chek tanlanmadi");
    if (!ALLOWED.has(file.type)) return jsonError("Faqat JPG, PNG yoki WEBP rasm yuklang");
    if (file.size > MAX_SIZE) return jsonError("Chek 6 MB dan katta bo‘lmasin");

    const dir = path.join(process.cwd(), "public", "uploads", "receipts");
    await mkdir(dir, { recursive: true });
    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return Response.json({ url: `/uploads/receipts/${name}` });
  } catch (error) {
    console.error(error);
    return jsonError("Chek yuklanmadi", 500);
  }
}
