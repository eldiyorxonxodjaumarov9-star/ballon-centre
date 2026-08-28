export const SEASON_LABEL: Record<string, string> = {
  SUMMER: "Yozgi",
  WINTER: "Qishki",
  ALL_SEASON: "4 fasl",
};

export const ORDER_STATUS: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  NEW: { label: "Kutilmoqda", color: "#E8C547", emoji: "🟡" },
  DELIVERED: { label: "Yetkazildi", color: "#3DDC97", emoji: "✅" },
  PICKED_UP: { label: "Olib ketildi", color: "#3DDC97", emoji: "📦" },
  CONFIRMED: { label: "Kutilmoqda", color: "#E8C547", emoji: "🟡" },
  PROCESSING: { label: "Kutilmoqda", color: "#E8C547", emoji: "🟡" },
  DELIVERING: { label: "Kutilmoqda", color: "#E8C547", emoji: "🟡" },
  COMPLETED: { label: "Yetkazildi", color: "#3DDC97", emoji: "✅" },
  CANCELLED: { label: "Bekor qilingan", color: "#F07167", emoji: "🔴" },
};

export const ADMIN_ORDER_STATUS: Record<string, { label: string; color: string; emoji: string }> = {
  NEW: { label: "Kutilmoqda", color: "#E8C547", emoji: "🟡" },
  DELIVERED: { label: "Yetkazildi", color: "#3DDC97", emoji: "✅" },
  PICKED_UP: { label: "Olib ketildi", color: "#3DDC97", emoji: "📦" },
};

export const DELIVERY_LABEL: Record<string, string> = {
  COURIER: "Kuryer orqali",
  PICKUP: "O'zim olib ketaman",
};

export const PAYMENT_LABEL: Record<string, string> = {
  CARD: "Karta",
  CASH: "Naqd pul",
  TRANSFER: "Perechisleniya",
};

export const SUPPORT = {
  telegramUrl: "https://t.me/dustmuhammedovich",
  telegramUsername: "@dustmuhammedovich",
  phoneDisplay: "+998 88 104 14 14",
  phoneTel: "+998881041414",
};
