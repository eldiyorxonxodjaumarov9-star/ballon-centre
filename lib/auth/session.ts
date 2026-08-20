import { NextRequest } from "next/server";
import { isMockMode, prisma } from "@/lib/db/prisma";
import { getBotToken, validateInitData } from "@/lib/telegram/validate";
import type { TelegramUser } from "@/types";

export function getTelegramUserFromRequest(request: NextRequest): TelegramUser | null {
  const initData = request.headers.get("x-telegram-init-data") ?? "";
  const botToken = process.env.BOT_TOKEN;
  if (!initData || !botToken) return null;
  return validateInitData(initData, getBotToken())?.user ?? null;
}

export async function getUserFromRequest(request: NextRequest) {
  if (isMockMode()) return null;
  const telegramUser = getTelegramUserFromRequest(request);
  if (!telegramUser) return null;

  const telegramId = String(telegramUser.id);
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return prisma.user.upsert({
    where: { telegramId },
    update: {
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      languageCode: telegramUser.language_code,
      photoUrl: telegramUser.photo_url,
      role: adminIds.includes(telegramId) ? "ADMIN" : undefined,
    },
    create: {
      telegramId,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      languageCode: telegramUser.language_code,
      photoUrl: telegramUser.photo_url,
      role: adminIds.includes(telegramId) ? "ADMIN" : "CUSTOMER",
    },
  });
}
