import { prisma, isMockMode } from "@/lib/db/prisma";
import { BRANDS } from "@/lib/data/catalog";
import { jsonError } from "@/lib/api/http";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  country: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    if (isMockMode()) return Response.json({ brands: BRANDS });
    const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
    return Response.json({ brands });
  } catch (error) {
    console.error(error);
    return jsonError("Brendlar yuklanmadi", 500);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Brend noto‘g‘ri");
    if (isMockMode()) return Response.json({ brand: { id: `br-${Date.now()}`, ...parsed.data } });
    const brand = await prisma.brand.create({
      data: { name: parsed.data.name, country: parsed.data.country, slug: slugify(parsed.data.name) },
    });
    return Response.json({ brand });
  } catch (error) {
    console.error(error);
    return jsonError("Brend yaratilmadi", 400);
  }
}
