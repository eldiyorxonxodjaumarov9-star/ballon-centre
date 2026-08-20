import { isMockMode, prisma } from "@/lib/db/prisma";
import { getStoredUserByTelegramId, saveStoredUser } from "@/lib/data/mock-store";
import { normalizeUzPhone } from "@/lib/phone";
import type { CustomerAccount, TelegramUser } from "@/types";

export type PublicCustomer = {
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  phone?: string | null;
};

function toPublic(account: {
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  phone?: string | null;
}): PublicCustomer {
  return {
    telegramId: account.telegramId,
    firstName: account.firstName,
    lastName: account.lastName ?? null,
    username: account.username ?? null,
    phone: account.phone ?? null,
  };
}

export function isRegistered(phone?: string | null): boolean {
  return Boolean(phone && phone.trim());
}

export async function findCustomerByTelegramId(telegramId: string): Promise<PublicCustomer | null> {
  if (isMockMode()) {
    const stored = getStoredUserByTelegramId(telegramId);
    return stored ? toPublic(stored) : null;
  }

  const user = await prisma.user.findUnique({ where: { telegramId } });
  return user ? toPublic(user) : null;
}

export type RegisterResult = {
  user: PublicCustomer;
  registered: true;
  isNewRegistration: boolean;
};

export async function registerCustomer(input: {
  telegramUser: TelegramUser;
  firstName: string;
  phone: string;
}): Promise<RegisterResult> {
  const firstName = input.firstName.trim();
  const phone = normalizeUzPhone(input.phone);
  if (!phone) {
    throw new Error("Telefon raqami noto‘g‘ri. Masalan: +998901234567");
  }
  if (firstName.length < 2 || firstName.length > 80) {
    throw new Error("Ism 2–80 belgi oralig‘ida bo‘lsin");
  }

  const telegramId = String(input.telegramUser.id);
  const now = new Date().toISOString();

  if (isMockMode()) {
    const existing = getStoredUserByTelegramId(telegramId);
    const hadPhone = isRegistered(existing?.phone);
    const account: CustomerAccount = {
      telegramId,
      firstName,
      lastName: input.telegramUser.last_name ?? existing?.lastName ?? null,
      username: input.telegramUser.username ?? existing?.username ?? null,
      languageCode: input.telegramUser.language_code ?? existing?.languageCode ?? null,
      photoUrl: input.telegramUser.photo_url ?? existing?.photoUrl ?? null,
      phone,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    saveStoredUser(account);
    return {
      user: toPublic(account),
      registered: true,
      isNewRegistration: !hadPhone,
    };
  }

  const existing = await prisma.user.findUnique({ where: { telegramId } });
  const hadPhone = isRegistered(existing?.phone);

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      firstName,
      lastName: input.telegramUser.last_name ?? undefined,
      username: input.telegramUser.username ?? undefined,
      languageCode: input.telegramUser.language_code ?? undefined,
      photoUrl: input.telegramUser.photo_url ?? undefined,
      phone,
    },
    create: {
      telegramId,
      firstName,
      lastName: input.telegramUser.last_name,
      username: input.telegramUser.username,
      languageCode: input.telegramUser.language_code,
      photoUrl: input.telegramUser.photo_url,
      phone,
      role: "CUSTOMER",
    },
  });

  return {
    user: toPublic(user),
    registered: true,
    isNewRegistration: !hadPhone,
  };
}
