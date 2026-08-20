import { prisma, isMockMode } from "@/lib/db/prisma";
import { CATEGORIES } from "@/lib/data/catalog";
import { jsonError } from "@/lib/api/http";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/utils";

const schema = z.object({
  nameUz: z.string().min(2),
  name: z.string().min(2).optional(),
  emoji: z.string().min(1),
  description: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    if (isMockMode()) return Response.json({ categories: CATEGORIES });
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
    return Response.json({ categories });
  } catch (error) {
    console.error(error);
    return jsonError("Kategoriyalar yuklanmadi", 500);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Kategoriya ma'lumoti noto‘g‘ri");
    if (isMockMode()) return Response.json({ category: { id: `cat-${Date.now()}`, ...parsed.data } });
    const category = await prisma.category.create({
      data: {
        nameUz: parsed.data.nameUz,
        name: parsed.data.name ?? parsed.data.nameUz,
        emoji: parsed.data.emoji,
        description: parsed.data.description,
        slug: slugify(parsed.data.nameUz),
        sortOrder: 99,
      },
    });
    return Response.json({ category });
  } catch (error) {
    console.error(error);
    return jsonError("Kategoriya yaratilmadi", 400);
  }
}
