"use client";

import { Trash2 } from "lucide-react";
import type { CartItem } from "@/types";
import { formatPrice, formatProductSpec, productKind } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { TireVisual } from "@/components/product/tire-visual";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { haptic } from "@/lib/telegram/webapp";

export function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const { product } = item;
  const size = formatProductSpec(product);
  const max = Math.max(product.stock || 1, item.quantity);

  return (
    <article className="premium-card flex gap-3 rounded-3xl p-3">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#0c0818]">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.model} className="absolute inset-0 h-full w-full object-contain p-1" />
        ) : (
          <TireVisual
            brand={product.brand.name}
            model={product.model}
            size={size}
            season={product.season}
            variant={productKind(product)}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#9CA3AF]">{product.brand.name}</p>
            <h3 className="truncate text-sm font-medium">{product.model}</h3>
            <p className="text-xs text-[#9CA3AF]">{size}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              remove(product.id);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9CA3AF]"
            aria-label="O‘chirish"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="min-w-0 truncate text-sm font-bold">{formatPrice(product.price * item.quantity)}</p>
          <QuantityStepper
            value={item.quantity}
            min={0}
            max={max}
            onChange={(next) => setQuantity(product.id, next)}
          />
        </div>
      </div>
    </article>
  );
}
