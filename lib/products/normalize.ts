import { normalizeProductImages } from "@/lib/uploads/storage";
import type { PriceCurrency, Product } from "@/types";

type ProductLike = Product & {
  width?: string | number;
  profile?: string | number;
  diameter?: string | number;
  priceCurrency?: PriceCurrency | null;
};

export function normalizeProduct(product: ProductLike): Product {
  return {
    ...product,
    width: String(product.width),
    profile: String(product.profile),
    diameter: String(product.diameter),
    images: normalizeProductImages(product.images ?? []),
    priceCurrency: product.priceCurrency ?? "UZS",
    originalPrice: product.originalPrice ?? null,
    originalOldPrice: product.originalOldPrice ?? null,
    usdRateAtEntry: product.usdRateAtEntry ?? null,
  };
}
