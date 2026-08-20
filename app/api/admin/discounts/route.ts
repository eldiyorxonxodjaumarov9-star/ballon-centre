import { prisma, isMockMode } from "@/lib/db/prisma";
import { jsonError } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/require-admin";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  percent: z.number().int().min(1).max(90).optional(),
  amount: z.number().int().positive().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    if (isMockMode()) {
      return Response.json({
        discounts: [{ id: "d1", name: "Yozgi -15%", percent: 15, isActive: true }],
      });
    }
    const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ discounts });
  } catch (error) {
    console.error(error);
    return jsonError("Chegirmalar yuklanmadi", 500);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Chegirma noto‘g‘ri");
    if (isMockMode()) return Response.json({ discount: { id: `d-${Date.now()}`, ...parsed.data, isActive: true } });
    const discount = await prisma.discount.create({ data: parsed.data });
    return Response.json({ discount });
  } catch (error) {
    console.error(error);
    return jsonError("Chegirma yaratilmadi", 400);
  }
}
