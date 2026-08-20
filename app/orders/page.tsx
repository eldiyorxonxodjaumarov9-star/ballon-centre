"use client";

import { useEffect, useState } from "react";
import { OrderCard } from "@/components/order/order-card";
import { OrderSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api/client";
import type { Order } from "@/types";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ orders: Order[] }>("/api/orders")
      .then((r) => setOrders(r.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em]">Buyurtmalarim</h1>
      {error ? <ErrorState message={error} /> : null}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon="📦" title="Hali buyurtma yo‘q" actionLabel="Katalogga" onAction={() => router.push("/catalog")} />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
