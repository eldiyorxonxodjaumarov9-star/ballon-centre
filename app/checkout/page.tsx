"use client";

import { useRouter } from "next/navigation";
import { CheckoutForm } from "@/components/order/checkout-form";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";
import { useCart, cartTotal } from "@/hooks/use-cart";

export default function CheckoutPage() {
  const items = useCart((s) => s.items) ?? [];
  const total = cartTotal(items);
  const router = useRouter();

  if (!items.length) {
    return <EmptyState icon="🛒" title="Savatingiz bo‘sh" actionLabel="Katalogga" onAction={() => router.push("/catalog")} />;
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="text-sm font-semibold uppercase tracking-[0.2em]">Buyurtma</h1>
      <p className="mt-2 mb-5 text-sm text-[#9CA3AF]">Jami: {formatPrice(total)}</p>
      <CheckoutForm />
    </div>
  );
}
