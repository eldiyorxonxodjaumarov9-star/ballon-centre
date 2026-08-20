import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { updateOrderStatus } from "../lib/services/order.service";
import { ORDER_STATUS } from "../lib/constants";
import type { OrderStatus } from "../types";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is required. Check .env");
  process.exit(1);
}

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
if (!appUrl.startsWith("https://")) {
  console.error(
    "NEXT_PUBLIC_APP_URL https bo‘lishi shart. Telegram localhost ni ochmaydi.\nHozirgi qiymat:",
    appUrl || "(bo‘sh)",
  );
  process.exit(1);
}

const bot = new Bot(token);

const welcomeText = [
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
].join("\n");

function shopKeyboards() {
  return {
    inline: new InlineKeyboard().webApp("🚀 DO‘KONNI OCHISH", appUrl),
    reply: new Keyboard().webApp("🚀 DO‘KONNI OCHISH", appUrl).resized(),
  };
}

bot.command("start", async (ctx) => {
  const { inline, reply } = shopKeyboards();
  await ctx.reply(welcomeText, { reply_markup: inline });
  await ctx.reply("Do‘konni pastki tugma orqali ham ochishingiz mumkin.", { reply_markup: reply });
});

bot.command("admin", async (ctx) => {
  const adminUrl = `${appUrl}/admin/login`;
  await ctx.reply("Admin ilovasiga kirish uchun telefon va parol kerak.", {
    reply_markup: new InlineKeyboard().webApp("🔐 ADMINNI OCHISH", adminUrl),
  });
});

bot.command("id", async (ctx) => {
  await ctx.reply(`Chat ID: ${ctx.chat.id}\nTur: ${ctx.chat.type}`);
});

bot.callbackQuery(/^ord:(del|pick):(.+)$/, async (ctx) => {
  const match = ctx.match;
  const action = match[1];
  const orderId = match[2];
  const status: OrderStatus = action === "del" ? "DELIVERED" : "PICKED_UP";
  const label = ORDER_STATUS[status];

  try {
    const order = await updateOrderStatus(orderId, status);
    if (!order) {
      await ctx.answerCallbackQuery({ text: "Buyurtma topilmadi", show_alert: true });
      return;
    }

    await ctx.answerCallbackQuery({ text: `${label.label} deb belgilandi` });

    const base = ctx.callbackQuery.message?.text ?? ctx.callbackQuery.message?.caption ?? "";
    const updatedText = base.includes("Status:")
      ? base.replace(/Status:.*$/m, `Status: ${label.emoji} ${label.label}`)
      : `${base}\n\nStatus: ${label.emoji} ${label.label}`;

    try {
      if (ctx.callbackQuery.message?.text) {
        await ctx.editMessageText(updatedText, {
          reply_markup: {
            inline_keyboard: [[{ text: `${label.emoji} ${label.label}`, callback_data: "ord:done" }]],
          },
        });
      } else {
        await ctx.editMessageReplyMarkup({
          reply_markup: {
            inline_keyboard: [[{ text: `${label.emoji} ${label.label}`, callback_data: "ord:done" }]],
          },
        });
      }
    } catch {
      // message may already be edited
    }
  } catch (error) {
    console.error("Status yangilanmadi", error);
    await ctx.answerCallbackQuery({ text: "Status yangilanmadi", show_alert: true });
  }
});

bot.callbackQuery("ord:done", async (ctx) => {
  await ctx.answerCallbackQuery({ text: "Status allaqachon yangilangan" });
});

bot.catch((err) => {
  console.error("Bot error", err);
});

async function setupMenuButton() {
  await bot.api.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Do‘kon",
      web_app: { url: appUrl },
    },
  });
}

void (async () => {
  await bot.api.deleteWebhook({ drop_pending_updates: false });
  await bot.api.setMyCommands([
    { command: "start", description: "Do‘konni ochish" },
    { command: "admin", description: "Admin ilovasini ochish" },
  ]);
  await setupMenuButton();
  await bot.start({
    onStart: (info) => {
      console.log(`Bot started as @${info.username}`);
      console.log(`Mini App URL: ${appUrl}`);
    },
  });
})();
