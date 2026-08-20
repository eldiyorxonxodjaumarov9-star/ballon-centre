import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
