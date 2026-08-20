import { readFile } from "fs/promises";
import { join } from "path";
import { DELIVERY_LABEL, ORDER_STATUS, PAYMENT_LABEL } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function extractCoords(address: string, lat?: number, lng?: number): { lat: number; lng: number } | null {
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  const coords = address.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (!coords) return null;
  return { lat: Number(coords[1]), lng: Number(coords[2]) };
}

function mapsLink(coords: { lat: number; lng: number } | null): string | null {
  if (!coords) return null;
  return `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
}

export function formatOrderMessage(order: Order, coords: { lat: number; lng: number } | null): string {
  const items = order.items
    .map((item) => `• ${escapeHtml(item.name)} ${escapeHtml(item.size)} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`)
    .join("\n");
  const map = mapsLink(coords);
  const cleanAddress = order.address.replace(/\s*\(-?\d+\.\d+\s*,\s*-?\d+\.\d+\)\s*$/, "");
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.NEW;
  const lines = [
    `<b>🛒 Yangi buyurtma #${escapeHtml(order.orderNumber)}</b>`,
    `<b>Status:</b> ${status.emoji} ${escapeHtml(status.label)}`,
    "",
    `<b>Mijoz:</b> ${escapeHtml(order.customerName)}`,
    `<b>Telefon:</b> ${escapeHtml(order.phone)}`,
    `<b>Yetkazish:</b> ${escapeHtml(DELIVERY_LABEL[order.deliveryType] ?? order.deliveryType)}`,
    `<b>To‘lov:</b> ${escapeHtml(PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod)}`,
    `<b>Manzil:</b> ${escapeHtml(order.city)}, ${escapeHtml(cleanAddress)}`,
  ];
  if (order.receiptUrl) lines.push("<b>Chek:</b> yuklandi");
  if (map) lines.push(`<b>Xarita:</b> <a href="${map}">Google Maps</a>`);
  if (order.note) lines.push(`<b>Izoh:</b> ${escapeHtml(order.note)}`);
  lines.push("", "<b>Mahsulotlar:</b>", items, "", `<b>Jami:</b> ${formatPrice(order.total)}`);
  return lines.join("\n");
}

export function orderStatusKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Yetkazildi", callback_data: `ord:del:${orderId}` },
        { text: "📦 Olib ketildi", callback_data: `ord:pick:${orderId}` },
      ],
    ],
  };
}

async function telegramCall(token: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
  };
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.description || `${method} failed`);
  }
  return payload.result;
}

export async function notifyOrderGroup(
  order: Order,
  extra?: { lat?: number; lng?: number },
): Promise<void> {
  const token = process.env.BOT_TOKEN;
  const groupId = (process.env.TELEGRAM_GROUP_ID ?? "").trim();
  if (!token || !groupId) return;

  const coords = extractCoords(order.address, extra?.lat, extra?.lng);
  const text = await telegramCall(token, "sendMessage", {
    chat_id: groupId,
    text: formatOrderMessage(order, coords),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: orderStatusKeyboard(order.id),
  });

  const replyTo = text?.message_id;

  if (order.receiptUrl && /^\/uploads\/receipts\/[a-zA-Z0-9._-]+$/.test(order.receiptUrl)) {
    try {
      const receiptPath = join(process.cwd(), "public", order.receiptUrl.replace(/^\//, ""));
      const receipt = await readFile(receiptPath);
      const form = new FormData();
      form.set("chat_id", groupId);
      form.set("caption", `🧾 To‘lov cheki · #${order.orderNumber}`);
      form.set("photo", new Blob([new Uint8Array(receipt)], { type: "image/jpeg" }), "receipt.jpg");
      if (replyTo) form.set("reply_to_message_id", String(replyTo));
      const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: form });
      const photoPayload = (await photoRes.json().catch(() => ({}))) as { ok?: boolean; description?: string };
      if (!photoRes.ok || photoPayload.ok === false) {
        console.error("Chek yuborilmadi", photoPayload.description);
      }
    } catch (error) {
      console.error("Chek yuborilmadi", error);
    }
  }

  if (!coords) return;

  await telegramCall(token, "sendLocation", {
    chat_id: groupId,
    latitude: coords.lat,
    longitude: coords.lng,
    ...(replyTo ? { reply_to_message_id: replyTo } : {}),
  });
}

export async function notifyOrderCustomer(
  order: Order,
  telegramId?: number | string | null,
): Promise<void> {
  const token = process.env.BOT_TOKEN;
  if (!token || !telegramId) return;

  const items = order.items
    .map((item) => `• ${escapeHtml(item.name)} ${escapeHtml(item.size)} × ${item.quantity}`)
    .join("\n");
  const caption = [
    `<b>✅ Buyurtmangiz qabul qilindi</b>`,
    "",
    `<b>Buyurtma raqami:</b> #${escapeHtml(order.orderNumber)}`,
    `<b>Jami:</b> ${formatPrice(order.total)}`,
    "",
    items,
    "",
    "Tez orada operatorimiz siz bilan bog‘lanadi.",
  ].join("\n");

  const photoPath = join(process.cwd(), "public", "brand", "order-success.png");
  const photo = await readFile(photoPath);
  const form = new FormData();
  form.set("chat_id", String(telegramId));
  form.set("caption", caption.slice(0, 1024));
  form.set("parse_mode", "HTML");
  form.set("photo", new Blob([new Uint8Array(photo)], { type: "image/png" }), "order-success.png");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.description || "Mijozga rasm yuborilmadi");
  }
}
