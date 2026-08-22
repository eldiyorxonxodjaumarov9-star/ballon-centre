import { readFile } from "fs/promises";
import { resolveProductImagePath } from "@/lib/uploads/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  const resolved = resolveProductImagePath(filename);
  if (!resolved) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(resolved.filePath);
    return new Response(data, {
      headers: {
        "Content-Type": resolved.contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
