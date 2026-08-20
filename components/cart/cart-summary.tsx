"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartSummary({
  count,
  total,
  href = "/checkout",
  label = "Buyurtma berish",
}: {
  count: number;
  total: number;
  href?: string;
  label?: string;
}) {
  return (
    <div className="premium-card mt-4 rounded-3xl p-4">
      <div className="flex items-center justify-between text-sm text-[#9CA3AF]">
        <span>Mahsulotlar soni</span>
        <span className="text-white">{count} dona</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-sm text-[#9CA3AF]">Jami summa</span>
        <span className="text-xl font-bold">{formatPrice(total)}</span>
      </div>
      <Button asChild className="mt-4 w-full uppercase tracking-[0.14em]">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
