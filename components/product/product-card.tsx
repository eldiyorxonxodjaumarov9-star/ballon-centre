"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { Product } from "@/types";
import { TireVisual } from "@/components/product/tire-visual";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { formatProductPrice, formatProductSpec, productDiscountPercent, productKind } from "@/lib/utils";
import { ProductImage } from "@/components/product/product-image";
import { SEASON_LABEL } from "@/lib/constants";
import { useCart } from "@/hooks/use-cart";
import { haptic } from "@/lib/telegram/webapp";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const setQuantity = useCart((s) => s.setQuantity);
  const quantity = useCart((s) => s.items.find((item) => item.productId === product.id)?.quantity ?? 0);
  const discount = productDiscountPercent(product);
  const size = formatProductSpec(product);
  const kind = productKind(product);
  const inStock = product.stock > 0;

  return (
    <article className="premium-card flex h-full min-w-0 flex-col overflow-hidden rounded-3xl">
      <Link href={`/product/${product.slug}`} className="block min-w-0">
        <div className="relative aspect-square overflow-hidden bg-[#0c0818]">
          <ProductImage
            src={product.images?.[0]}
            alt={product.model}
            imgClassName="absolute inset-0 h-full w-full object-contain p-2"
            fallback={
              <TireVisual
                brand={product.brand.name}
                model={product.model}
                size={size}
                season={product.season}
                className="absolute inset-0 h-full w-full"
                variant={kind}
              />
            }
          />
          <div className="absolute inset-x-2 top-2 z-20 flex items-start justify-between gap-1">
            {discount ? (
              <span className="shrink-0 rounded-full bg-[#3f2a9b] px-2 py-0.5 text-[9px] font-bold text-white">
                -{discount}%
              </span>
            ) : (
              <span />
            )}
            <span
              className={`max-w-[72%] truncate rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                inStock ? "bg-black/55 text-[#3ddc97]" : "bg-black/55 text-[#f07167]"
              }`}
            >
              {inStock ? "Omborda" : "Tugagan"}
            </span>
          </div>
        </div>
        <div className="min-w-0 px-2.5 pt-2.5">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
            {product.brand.name}
          </p>
          <h3 className="mt-0.5 truncate text-sm font-medium">{product.model}</h3>
          <p className="mt-1 truncate text-xs text-[#9CA3AF]">
            {kind === "tire" ? `${size} · ${SEASON_LABEL[product.season]}` : size}
          </p>
          <div className="mt-2 flex min-w-0 items-end gap-1.5">
            <p className="truncate text-[13px] leading-tight font-bold tracking-tight">{formatProductPrice(product)}</p>
            {product.oldPrice || product.originalOldPrice ? (
              <p className="truncate pb-0.5 text-[10px] text-[#9CA3AF] line-through">{formatProductPrice(product, { old: true })}</p>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="mt-auto flex justify-center p-2.5 pt-2">
        {quantity > 0 ? (
          <QuantityStepper
            size="sm"
            value={quantity}
            min={0}
            max={Math.max(product.stock || 1, quantity)}
            onChange={(next) => setQuantity(product.id, next)}
          />
        ) : (
          <button
            disabled={!inStock}
            onClick={() => {
              add(product);
              haptic("success");
              toast.success("Savatga qo‘shildi");
            }}
            className="flex h-9 w-full items-center justify-center rounded-full border border-[rgba(139,116,255,0.28)] bg-[rgba(63,42,155,0.22)] px-2 text-[10px] leading-none font-semibold whitespace-nowrap text-white transition hover:border-[rgba(139,116,255,0.55)] hover:bg-[rgba(63,42,155,0.4)] disabled:opacity-40"
          >
            Savatga +
          </button>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
