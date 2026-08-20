import { NextRequest } from "next/server";
import { createOrder, listOrdersForUser } from "@/lib/services/order.service";
import { getTelegramUserFromRequest, getUserFromRequest } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validations";
import { jsonError } from "@/lib/api/http";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { isMockMode } from "@/lib/db/prisma";
import { notifyOrderCustomer, notifyOrderGroup } from "@/lib/telegram/notify-order";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user && !isMockMode()) return jsonError("Avtorizatsiya talab qilinadi", 401);
    const orders = await listOrdersForUser(user?.id ?? "mock");
    return Response.json({ orders });
  } catch (error) {
    console.error(error);
    return jsonError("Buyurtmalar yuklanmadi", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!rateLimit(clientKey(request.headers.get("x-forwarded-for"), "orders"), 10, 60_000)) {
    return jsonError("Juda ko‘p buyurtma urinishi", 429);
  }

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto‘g‘ri");
    }

    const user = await getUserFromRequest(request);
    if (!user && !isMockMode()) {
      return jsonError("Buyurtma uchun Telegram orqali kiring", 401);
    }

    const order = await createOrder(parsed.data, user?.id);
    const telegramUser = getTelegramUserFromRequest(request);
    const coords = { lat: parsed.data.lat, lng: parsed.data.lng };
    void Promise.allSettled([
      notifyOrderGroup(order, coords),
      notifyOrderCustomer(order, telegramUser?.id),
    ]).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") console.error("Telegram xabar yuborilmadi", result.reason);
      }
    });
    return Response.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Buyurtma yaratilmadi";
    return jsonError(message, 400);
  }
}
