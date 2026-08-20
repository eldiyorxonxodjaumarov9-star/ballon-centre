import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/api/http";
import { isMockMode } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      if (isMockMode()) {
        return Response.json({
          user: {
            telegramId: "guest",
            firstName: "Mehmon",
            username: null,
          },
        });
      }
      return jsonError("Telegram foydalanuvchisi aniqlanmadi", 401);
    }
    return Response.json({
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        languageCode: user.languageCode,
        photoUrl: user.photoUrl,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(error);
    return jsonError("Telegram WebApp xatosi", 500);
  }
}
