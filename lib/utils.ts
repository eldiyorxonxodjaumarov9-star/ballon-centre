import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PriceCurrency, Product } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function groupThousands(value: number | string): string {
  const digits = typeof value === "number" ? String(Math.round(value)) : digitsOnly(value);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatPrice(amount: number): string {
  return `${groupThousands(amount)} so'm`;
}

export function formatUsdPrice(amount: number): string {
  return `$${groupThousands(amount)}`;
}

export function productPriceCurrency(product: Pick<Product, "priceCurrency">): PriceCurrency {
  return product.priceCurrency ?? "UZS";
}

export function formatProductPrice(
  product: Pick<Product, "price" | "oldPrice" | "priceCurrency" | "originalPrice" | "originalOldPrice">,
  options?: { quantity?: number; old?: boolean },
): string {
  const qty = options?.quantity ?? 1;
  const currency = productPriceCurrency(product);

  if (currency === "USD") {
    const amount = options?.old
      ? (product.originalOldPrice ?? product.oldPrice ?? 0)
      : (product.originalPrice ?? product.price);
    return formatUsdPrice(amount * qty);
  }

  const amount = options?.old ? (product.oldPrice ?? 0) : product.price;
  return formatPrice(amount * qty);
}

export function productDiscountPercent(product: Pick<Product, "price" | "oldPrice" | "priceCurrency" | "originalPrice" | "originalOldPrice">): number | null {
  const currency = productPriceCurrency(product);
  if (currency === "USD") {
    const price = product.originalPrice;
    const oldPrice = product.originalOldPrice;
    return discountPercent(price ?? 0, oldPrice);
  }
  return discountPercent(product.price, product.oldPrice);
}

export function formatSize(width: string | number, profile: string | number, diameter: string | number): string {
  const w = String(width).trim();
  const p = String(profile).trim();
  const d = String(diameter).trim();
  const diam = /^r/i.test(d) ? d : `R${d}`;
  return `${w}/${p} ${diam}`;
}

export function productKind(product: { category?: { slug?: string } | null }): "tire" | "battery" | "rim" {
  const slug = product.category?.slug;
  if (slug === "akkumulyatorlar") return "battery";
  if (slug === "disklar") return "rim";
  return "tire";
}

export function formatProductSpec(product: {
  width: string | number;
  profile: string | number;
  diameter: string | number;
  category?: { slug?: string } | null;
}): string {
  const kind = productKind(product);
  const w = String(product.width ?? "").trim();
  const p = String(product.profile ?? "").trim();
  const d = String(product.diameter ?? "").trim();
  if (kind === "battery") {
    const volt = w ? (/v/i.test(w) ? w : `${w}V`) : "";
    const ah = p ? (/ah/i.test(p) ? p : `${p}Ah`) : "";
    return [volt, ah].filter(Boolean).join(" · ");
  }
  if (kind === "rim") {
    const widthLabel = w ? (/j/i.test(w) ? w : `${w}J`) : "";
    const diam = d ? (/^r/i.test(d) ? d : `R${d}`) : "";
    return [widthLabel, diam].filter(Boolean).join(" × ");
  }
  return formatSize(w, p, d);
}

export function formatOrderNumber(n: string): string {
  return n.startsWith("#") ? n : `#${n}`;
}

export function discountPercent(price: number, oldPrice?: number | null): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
