import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { jsonError } from "@/lib/api/http";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const MAX_SIZE = 6 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((item): item is File => item instanceof File);
    if (!files.length) return jsonError("Rasm tanlanmadi");
    if (files.length > 6) return jsonError("Bir mahsulotga maksimal 6 ta rasm");

    const dir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(dir, { recursive: true });

    const urls: string[] = [];
    for (const file of files.slice(0, 6)) {
      if (!ALLOWED.has(file.type)) return jsonError("Faqat JPG, PNG yoki WEBP rasm yuklang");
      if (file.size > MAX_SIZE) return jsonError("Rasm 6 MB dan katta bo‘lmasin");
      const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, name), bytes);
      urls.push(`/uploads/products/${name}`);
    }

    return Response.json({ urls });
  } catch (error) {
    console.error(error);
    return jsonError("Rasm yuklanmadi", 500);
  }
}
