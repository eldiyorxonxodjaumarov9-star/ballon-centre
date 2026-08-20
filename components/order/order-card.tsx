"use client";

import Link from "next/link";
import type { Order, OrderItem } from "@/types";
import { TireVisual } from "@/components/product/tire-visual";
import { ORDER_STATUS } from "@/lib/constants";
import { formatPrice, productKind } from "@/lib/utils";

function itemImage(item: OrderItem): string | null {
  return item.product?.images?.[0] ?? null;
}

export function OrderCard({ order }: { order: Order }) {
  const status = ORDER_STATUS[order.status];
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const date = new Date(order.createdAt).toLocaleDateString("uz-UZ");
  const preview = order.items[0];
  const image = preview ? itemImage(preview) : null;

  return (
    <Link href={`/orders/${order.id}`} className="premium-card block rounded-3xl p-4">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#120a28]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={preview.name} className="h-full w-full object-contain p-1" />
          ) : preview?.product ? (
            <TireVisual
              brand={preview.product.brand.name}
              model={preview.product.model}
              size={preview.size}
              season={preview.product.season}
              variant={productKind(preview.product)}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xl">🛞</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">#{order.orderNumber}</p>
            <span className="shrink-0 text-xs" style={{ color: status.color }}>
              {status.emoji} {status.label}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-[#9CA3AF]">{preview?.name ?? "Buyurtma"}</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">{date}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-[#9CA3AF]">{count} dona</span>
            <span className="text-base font-bold">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
