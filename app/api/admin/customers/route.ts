import { NextRequest } from "next/server";
import { prisma, isMockMode } from "@/lib/db/prisma";
import { jsonError } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    if (isMockMode()) return Response.json({ customers: [] });
    const customers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        phone: true,
        telegramId: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    return Response.json({ customers });
  } catch (error) {
    console.error(error);
    return jsonError("Mijozlar yuklanmadi", 500);
  }
}
