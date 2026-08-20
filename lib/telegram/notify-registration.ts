import { readFile } from "fs/promises";
import { join } from "path";
import type { PublicCustomer } from "@/lib/services/user.service";

function welcomeCaption(firstName: string): string {
  return [
    "🎉 Akkauntingiz muvaffaqiyatli ochildi!",
    "",
    `Assalomu alaykum, ${firstName}! 👋`,
    "",
    "🛞 Ballon Shop — avtomobilingiz uchun sifatli va ishonchli ballonlar, akkumulyatorlar va disklar do‘koni.",
    "",
    "Bizda:",
    "✅ Yengil avtomobillar uchun ballonlar",
    "✅ Yuk mashinalari uchun ballonlar",
    "✅ Akkumulyatorlar",
    "✅ Avtomobil disklari",
    "✅ Qulay buyurtma va yetkazib berish",
    "",
    "Kerakli mahsulotni Telegram ichida tanlang, savatga qo‘shing va buyurtma bering.",
    "",
    "Ballon Shop — sifati yo‘lingizda sinaladi! 🚗",
  ].join("\n");
}

function groupMessage(user: PublicCustomer): string {
  const username = user.username ? `@${user.username}` : "Username mavjud emas";
  const date = new Date().toLocaleString("uz-UZ", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return [
    "🆕 YANGI MIJOZ AKKAUNT OCHDI",
    "",
    `👤 Ism: ${user.firstName}`,
    `📞 Telefon: ${user.phone ?? ""}`,
    `🆔 Telegram ID: ${user.telegramId}`,
    `🔗 Username: ${username}`,
    `🕐 Sana: ${date}`,
  ].join("\n");
}

export async function notifyCustomerWelcome(user: PublicCustomer): Promise<void> {
  const token = process.env.BOT_TOKEN;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (!token || !user.telegramId) return;

  const photoPath = join(process.cwd(), "public", "brand", "logo.png");
  const photo = await readFile(photoPath);
  const form = new FormData();
  form.set("chat_id", user.telegramId);
  form.set("caption", welcomeCaption(user.firstName).slice(0, 1024));
  form.set("photo", new Blob([new Uint8Array(photo)], { type: "image/png" }), "logo.png");
  if (appUrl) {
    form.set(
      "reply_markup",
      JSON.stringify({
        inline_keyboard: [[{ text: "🛍 DO‘KONNI OCHISH", web_app: { url: appUrl } }]],
      }),
    );
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.description || "Welcome photo yuborilmadi");
  }
}

export async function notifyGroupNewCustomer(user: PublicCustomer): Promise<void> {
  const token = process.env.BOT_TOKEN;
  const groupId = (process.env.TELEGRAM_GROUP_ID ?? "").trim();
  if (!token || !groupId) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: groupId,
      text: groupMessage(user),
      disable_web_page_preview: true,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.description || "Guruhga yangi mijoz xabari yuborilmadi");
  }
}

export async function notifyRegistrationSideEffects(user: PublicCustomer): Promise<void> {
  try {
    await notifyCustomerWelcome(user);
  } catch (error) {
    console.error("Mijozga welcome xabar yuborilmadi", error);
  }
  try {
    await notifyGroupNewCustomer(user);
  } catch (error) {
    console.error("Guruhga yangi mijoz xabari yuborilmadi", error);
  }
}
