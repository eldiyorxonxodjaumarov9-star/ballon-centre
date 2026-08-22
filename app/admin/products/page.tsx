"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatProductPrice, formatProductSpec } from "@/lib/utils";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  async function load() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    toast.success("O‘chirildi");
    void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Mahsulotlar</h1>
        <Button asChild size="sm">
          <Link href="/admin/products/new">Qo‘shish</Link>
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Hali mahsulot yo‘q. Qo‘shish tugmasi orqali qo‘shing.</p>
        ) : null}
        {products.map((p) => (
          <article key={p.id} className="premium-card flex gap-3 rounded-3xl p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#0c0818]">
              <ProductImage
                src={p.images?.[0]}
                alt=""
                imgClassName="absolute inset-0 h-full w-full object-contain p-1"
                fallback={
                  <div className="flex h-full items-center justify-center text-lg">{p.category?.emoji ?? "🛞"}</div>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {p.brand?.name} {p.model}
              </p>
              <p className="text-xs text-[#9CA3AF]">
                {p.category?.nameUz} · {formatProductSpec(p)}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-bold">{formatProductPrice(p)}</p>
                <p className="text-xs text-[#9CA3AF]">Omborda: {p.stock}</p>
              </div>
              <div className="mt-3 flex gap-3">
                <Link href={`/admin/products/${p.id}`} className="text-xs text-[#c4b5ff]">
                  Tahrirlash
                </Link>
                <button className="text-xs text-[#f07167]" onClick={() => remove(p.id)}>
                  O‘chirish
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
