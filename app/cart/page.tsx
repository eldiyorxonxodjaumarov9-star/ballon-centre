"use client";

import { useRouter } from "next/navigation";
import { CartLine } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart, cartCount, cartTotal } from "@/hooks/use-cart";

export default function CartPage() {
  const items = (useCart((s) => s.items) ?? []).filter((item) => item.product);
  const router = useRouter();
  const count = cartCount(items);
  const total = cartTotal(items);

  if (!items.length) {
    return (
      <EmptyState
        icon="🛒"
        title="Savatingiz hozircha bo‘sh"
        actionLabel="Ballonlarni ko‘rish"
        onAction={() => router.push("/catalog")}
      />
    );
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em]">Savat</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <CartLine key={item.productId} item={item} />
        ))}
      </div>
      <CartSummary count={count} total={total} />
    </div>
  );
}
