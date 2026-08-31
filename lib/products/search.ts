import type { Product } from "@/types";

const APOSTROPHES = /['’`ʻʼ]/g;

function normalizeSearchValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compactSearchValue(value: unknown): string {
  return normalizeSearchValue(value).replace(/\s/g, "");
}

function numericPart(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function productSearchFields(product: Product): string[] {
  const width = String(product.width ?? "").trim();
  const profile = String(product.profile ?? "").trim();
  const rawDiameter = String(product.diameter ?? "").trim();
  const diameter = rawDiameter.replace(/^r[\s/-]*/i, "");
  const compactSize = [width, profile, diameter].map(numericPart).join("");

  return [
    product.brand.name,
    product.model,
    product.name,
    product.description ?? "",
    product.category.nameUz,
    product.category.name,
    width,
    profile,
    rawDiameter,
    product.loadIndex,
    product.speedIndex,
    product.country,
    product.season,
    `${width}/${profile} R${diameter}`,
    `${width} ${profile} ${diameter}`,
    `R${diameter}`,
    compactSize,
    `${width}V`,
    `${profile}Ah`,
  ].filter(Boolean);
}

/**
 * Matches product text and sizes while ignoring separators used in tire specs.
 * Examples treated as equivalent: 235/75/R17.5, 235 75 17.5, 23575175.
 */
export function matchesProductQuery(product: Product, query?: string): boolean {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const fields = productSearchFields(product).map(normalizeSearchValue).filter(Boolean);
  const haystack = fields.join(" ");
  const queryTokens = normalizedQuery.split(" ");

  if (queryTokens.every((token) => haystack.includes(token))) return true;

  const compactQuery = compactSearchValue(normalizedQuery);
  return compactQuery.length > 0 && fields.some((field) => compactSearchValue(field).includes(compactQuery));
}
