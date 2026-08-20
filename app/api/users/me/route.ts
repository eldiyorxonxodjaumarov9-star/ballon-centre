import { NextRequest } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/api/http";
import { findCustomerByTelegramId, isRegistered, registerCustomer } from "@/lib/services/user.service";
import { notifyRegistrationSideEffects } from "@/lib/telegram/notify-registration";
import { customerRegistrationSchema } from "@/lib/validations";
import { normalizeUzPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const telegramUser = getTelegramUserFromRequest(request);
    if (!telegramUser) {
      return Response.json({ user: null, registered: false });
    }

    const user = await findCustomerByTelegramId(String(telegramUser.id));
    return Response.json({
      user: user
        ? {
            telegramId: user.telegramId,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phone: user.phone,
          }
        : null,
      registered: isRegistered(user?.phone),
    });
  } catch (error) {
    console.error(error);
    return jsonError("Telegram WebApp xatosi", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const telegramUser = getTelegramUserFromRequest(request);
    if (!telegramUser) {
      return jsonError("Telegram foydalanuvchisi aniqlanmadi", 401);
    }

    const body = await request.json();
    const parsed = customerRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto‘g‘ri");
    }

    if (!normalizeUzPhone(parsed.data.phone)) {
      return jsonError("Telefon raqami noto‘g‘ri. Masalan: +998 90 123 45 67");
    }

    const result = await registerCustomer({
      telegramUser,
      firstName: parsed.data.firstName,
      phone: parsed.data.phone,
    });

    if (result.isNewRegistration) {
      void notifyRegistrationSideEffects(result.user);
    }

    return Response.json({
      user: result.user,
      registered: true,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Akkaunt ochilmadi";
    return jsonError(message, 400);
  }
}
