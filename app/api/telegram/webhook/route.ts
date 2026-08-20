import { NextRequest } from "next/server";
import { Bot, InlineKeyboard, webhookCallback } from "grammy";

function getBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN missing");
  const bot = new Bot(token);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard().webApp("🚀 DO‘KONNI OCHISH", appUrl);
    await ctx.reply(
      [
        "Assalomu alaykum! 👋",
        "",
        "Avtomobilingiz uchun sifatli va ishonchli ballonlarni bir necha soniyada toping.",
        "",
        "Bizning premium online do‘konimiz orqali:",
        "• Ballonlarni ko‘rish",
        "• Kategoriyalar bo‘yicha tanlash",
        "• Mahsulot tafsilotlarini ko‘rish",
        "• Savatga qo‘shish",
        "• Buyurtma berish",
        "",
        "hammasini Telegram ichida amalga oshirishingiz mumkin.",
      ].join("\n"),
      { reply_markup: keyboard },
    );
  });

  return bot;
}

export async function POST(request: NextRequest) {
  try {
    const bot = getBot();
    const handler = webhookCallback(bot, "std/http");
    return handler(request);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Bot webhook xatosi" }, { status: 500 });
  }
}
