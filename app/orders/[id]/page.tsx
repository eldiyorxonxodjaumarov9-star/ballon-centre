"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import type { Order, OrderItem } from "@/types";
import { ORDER_STATUS, DELIVERY_LABEL, PAYMENT_LABEL } from "@/lib/constants";
import { formatPrice, productKind } from "@/lib/utils";
import { TireVisual } from "@/components/product/tire-visual";
import { OrderSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";

function itemImage(item: OrderItem): string | null {
  return item.product?.images?.[0] ?? null;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;
    webApp.BackButton.show();
    const onBack = () => router.back();
    webApp.BackButton.onClick(onBack);
    return () => {
      webApp.BackButton.offClick(onBack);
      webApp.BackButton.hide();
    };
  }, [router]);

  useEffect(() => {
    apiFetch<{ order: Order }>(`/api/orders/${params.id}`)
      .then((r) => setOrder(r.order))
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (error) return <div className="pt-8"><ErrorState message={error} /></div>;
  if (!order) return <div className="px-4 pt-4"><OrderSkeleton /></div>;

  const status = ORDER_STATUS[order.status];

  return (
    <div className="px-4 pt-4 pb-6">
      <p className="text-xs text-[#9CA3AF]">{new Date(order.createdAt).toLocaleString("uz-UZ")}</p>
      <h1 className="mt-1 text-xl font-semibold">#{order.orderNumber}</h1>
      <p className="mt-2 text-sm" style={{ color: status.color }}>
        {status.emoji} {status.label}
      </p>

      <div className="mt-4 space-y-3">
        {order.items.map((item) => (
          <article key={item.id} className="premium-card overflow-hidden rounded-3xl">
            <div className="relative">
              {itemImage(item) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={itemImage(item)!} alt={item.name} className="aspect-[4/3] w-full bg-[#0c0818] object-contain p-2" />
              ) : item.product ? (
                <TireVisual
                  brand={item.product.brand.name}
                  model={item.product.model}
                  size={item.size}
                  season={item.product.season}
                  variant={productKind(item.product)}
                  className="aspect-[4/3]"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[#120a28] text-4xl">🛞</div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                {item.product?.brand.name ?? "Mahsulot"}
              </p>
              <p className="mt-1 text-lg font-semibold">{item.name}</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">{item.size}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">{item.quantity} dona</span>
                <span className="text-base font-bold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="premium-card mt-4 space-y-2 rounded-3xl p-4 text-sm">
        <Row label="Ism" value={order.customerName} />
        <Row label="Telefon" value={order.phone} />
        <Row label="Manzil" value={`${order.city}, ${order.address}`} />
        <Row label="Yetkazish" value={DELIVERY_LABEL[order.deliveryType]} />
        <Row label="To‘lov" value={PAYMENT_LABEL[order.paymentMethod]} />
        {order.note ? <Row label="Izoh" value={order.note} /> : null}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[#9CA3AF]">Jami</span>
          <span className="text-lg font-bold">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[#9CA3AF]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
