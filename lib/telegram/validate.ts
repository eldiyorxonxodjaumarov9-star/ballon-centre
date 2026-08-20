import crypto from "crypto";
import type { TelegramUser } from "@/types";

interface ValidatedInitData {
  user: TelegramUser | null;
  authDate: number | null;
  queryId?: string;
}

function getSecretKey(botToken: string): Buffer {
  return crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
}

export function validateInitData(initData: string, botToken: string, maxAgeSeconds = 86400): ValidatedInitData | null {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = getSecretKey(botToken);
  const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computed, "hex");
  if (hashBuffer.length !== computedBuffer.length) return null;
  if (!crypto.timingSafeEqual(hashBuffer, computedBuffer)) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  let user: TelegramUser | null = null;
  const rawUser = params.get("user");
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as TelegramUser;
    } catch {
      return null;
    }
  }

  return {
    user,
    authDate,
    queryId: params.get("query_id") ?? undefined,
  };
}

export function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN is not configured");
  }
  return token;
}
