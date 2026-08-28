import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { CustomerAccount, Order, PaymentCard, Product } from "@/types";
import { CATEGORIES } from "@/lib/data/catalog";
import type { Category } from "@/types";

const dir = path.join(process.cwd(), "data");
const productsFile = path.join(dir, "products.json");
const ordersFile = path.join(dir, "orders.json");
const settingsFile = path.join(dir, "settings.json");
const usersFile = path.join(dir, "users.json");
const categoriesFile = path.join(dir, "categories.json");

type ShopSettings = {
  paymentCards: PaymentCard[];
  usdRate: number;
};

const DEFAULT_USD_RATE = 12_500;

const globalForStore = globalThis as unknown as {
  mockProducts?: Product[];
  mockOrders?: Order[];
  mockUsers?: CustomerAccount[];
  mockCategories?: Category[];
  shopSettings?: ShopSettings;
};

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function products(): Product[] {
  if (!globalForStore.mockProducts) {
    globalForStore.mockProducts = readJson<Product[]>(productsFile, []);
  }
  return globalForStore.mockProducts;
}

function orders(): Order[] {
  if (!globalForStore.mockOrders) {
    globalForStore.mockOrders = readJson<Order[]>(ordersFile, []);
  }
  return globalForStore.mockOrders;
}

function normalizeSettings(raw: unknown): ShopSettings {
  const data = raw as {
    paymentCard?: PaymentCard | null;
    paymentCards?: PaymentCard[];
    usdRate?: number;
  } | null;
  const usdRate =
    typeof data?.usdRate === "number" && data.usdRate > 0 ? Math.round(data.usdRate) : DEFAULT_USD_RATE;

  if (Array.isArray(data?.paymentCards)) {
    return { paymentCards: data.paymentCards, usdRate };
  }
  if (data?.paymentCard) {
    return {
      paymentCards: [
        {
          id: `card-${Date.now()}`,
          cardNumber: data.paymentCard.cardNumber,
          firstName: data.paymentCard.firstName,
          lastName: data.paymentCard.lastName,
          isActive: true,
        },
      ],
      usdRate,
    };
  }
  return { paymentCards: [], usdRate };
}

function dedupeCards(cards: PaymentCard[]): PaymentCard[] {
  const seen = new Set<string>();
  return cards.map((card) => {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      return card;
    }
    return { ...card, id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  });
}

function ensureSingleActive(cards: PaymentCard[]): PaymentCard[] {
  if (!cards.length) return [];
  const activeIdx = cards.findIndex((card) => card.isActive);
  const keepIdx = activeIdx >= 0 ? activeIdx : 0;
  return cards.map((card, index) => ({ ...card, isActive: index === keepIdx }));
}

function normalizeCards(cards: PaymentCard[]): PaymentCard[] {
  return ensureSingleActive(dedupeCards(cards));
}

function settings(): ShopSettings {
  if (!globalForStore.shopSettings) {
    globalForStore.shopSettings = normalizeSettings(readJson(settingsFile, { paymentCards: [], usdRate: DEFAULT_USD_RATE }));
  }
  if (!Array.isArray(globalForStore.shopSettings.paymentCards)) {
    globalForStore.shopSettings = normalizeSettings(globalForStore.shopSettings);
    writeJson(settingsFile, globalForStore.shopSettings);
  }
  if (!globalForStore.shopSettings.usdRate || globalForStore.shopSettings.usdRate <= 0) {
    globalForStore.shopSettings.usdRate = DEFAULT_USD_RATE;
  }
  return globalForStore.shopSettings;
}

function saveSettings(next: Partial<ShopSettings> & { paymentCards?: PaymentCard[] }) {
  const current = settings();
  const normalized: ShopSettings = {
    paymentCards: normalizeCards(next.paymentCards ?? current.paymentCards ?? []),
    usdRate:
      typeof next.usdRate === "number" && next.usdRate > 0
        ? Math.round(next.usdRate)
        : current.usdRate || DEFAULT_USD_RATE,
  };
  globalForStore.shopSettings = normalized;
  writeJson(settingsFile, normalized);
}

export function getStoredProducts(): Product[] {
  return products();
}

export function saveStoredProducts(next: Product[]) {
  globalForStore.mockProducts = next;
  writeJson(productsFile, next);
}

export function getStoredOrders(): Order[] {
  return orders();
}

export function saveStoredOrders(next: Order[]) {
  globalForStore.mockOrders = next;
  writeJson(ordersFile, next);
}

export function getUsdRate(): number {
  return settings().usdRate || DEFAULT_USD_RATE;
}

export function saveUsdRate(rate: number): number {
  const usdRate = Math.max(1, Math.round(rate));
  saveSettings({ usdRate });
  return usdRate;
}

export function listPaymentCards(): PaymentCard[] {
  const cards = settings().paymentCards ?? [];
  const normalized = normalizeCards(cards);
  if (JSON.stringify(cards) !== JSON.stringify(normalized)) {
    saveSettings({ paymentCards: normalized });
  }
  return normalized;
}

export function getActivePaymentCard(): PaymentCard | null {
  return listPaymentCards().find((card) => card.isActive) ?? null;
}

export function createPaymentCard(input: Omit<PaymentCard, "id" | "isActive">): PaymentCard {
  const current = listPaymentCards();
  const id = `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const card: PaymentCard = {
    id,
    ...input,
    isActive: false,
  };
  const next = normalizeCards([card, ...current]);
  saveSettings({ paymentCards: next });
  return next.find((c) => c.id === id)!;
}

export function updatePaymentCard(id: string, input: Partial<Omit<PaymentCard, "id" | "isActive">>): PaymentCard | null {
  const current = listPaymentCards();
  const idx = current.findIndex((card) => card.id === id);
  if (idx < 0) return null;
  const next = [...current];
  next[idx] = { ...next[idx], ...input };
  saveSettings({ paymentCards: next });
  return listPaymentCards().find((c) => c.id === id) ?? null;
}

export function activatePaymentCard(id: string): PaymentCard | null {
  const current = listPaymentCards();
  const idx = current.findIndex((card) => card.id === id);
  if (idx < 0) return null;
  const next = current.map((card) => ({ ...card, isActive: card.id === id }));
  saveSettings({ paymentCards: next });
  return next[idx];
}

export function deletePaymentCard(id: string): boolean {
  const current = listPaymentCards();
  const next = current.filter((card) => card.id !== id);
  if (next.length === current.length) return false;
  if (next.length && !next.some((card) => card.isActive)) {
    next[0] = { ...next[0], isActive: true };
  }
  saveSettings({ paymentCards: next });
  return true;
}

function users(): CustomerAccount[] {
  if (!globalForStore.mockUsers) {
    globalForStore.mockUsers = readJson<CustomerAccount[]>(usersFile, []);
  }
  return globalForStore.mockUsers;
}

export function getStoredUsers(): CustomerAccount[] {
  return users();
}

export function getStoredUserByTelegramId(telegramId: string): CustomerAccount | null {
  return users().find((user) => user.telegramId === telegramId) ?? null;
}

export function saveStoredUser(account: CustomerAccount): CustomerAccount {
  const current = users();
  const idx = current.findIndex((user) => user.telegramId === account.telegramId);
  const next = [...current];
  if (idx >= 0) next[idx] = account;
  else next.unshift(account);
  globalForStore.mockUsers = next;
  writeJson(usersFile, next);
  return account;
}

function categories(): Category[] {
  if (!globalForStore.mockCategories) {
    const stored = readJson<Category[]>(categoriesFile, CATEGORIES);
    globalForStore.mockCategories = stored;
    if (!existsSync(categoriesFile)) {
      writeJson(categoriesFile, stored);
    }
  }
  return globalForStore.mockCategories;
}

export function getStoredCategories(): Category[] {
  return categories();
}

export function saveStoredCategories(next: Category[]) {
  globalForStore.mockCategories = next;
  writeJson(categoriesFile, next);
}
