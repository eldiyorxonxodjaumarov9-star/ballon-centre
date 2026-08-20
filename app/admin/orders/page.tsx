"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { ADMIN_ORDER_STATUS, PAYMENT_LABEL } from "@/lib/constants";
import type { Order, OrderStatus } from "@/types";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data.orders ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    toast.success("Status yangilandi");
    void load();
  }

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Orders</h1>
      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="premium-card rounded-3xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">#{order.orderNumber}</p>
              <select
                className="rounded-full border border-white/10 bg-[#120a28] px-3 py-1 text-xs"
                value={
                  order.status === "DELIVERED" || order.status === "PICKED_UP" || order.status === "NEW"
                    ? order.status
                    : "NEW"
                }
                onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
              >
                {Object.entries(ADMIN_ORDER_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.emoji} {value.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-sm">
              {order.customerName} · {order.phone}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} · {order.city}, {order.address}
            </p>
            {order.receiptUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.receiptUrl} alt="Chek" className="mt-3 h-24 w-24 rounded-2xl object-cover" />
            ) : null}
            <p className="mt-2 text-sm font-bold">{formatPrice(order.total)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
