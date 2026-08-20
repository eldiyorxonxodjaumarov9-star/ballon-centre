"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { formatProductSpec } from "@/lib/utils";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Inventory</h1>
      <div className="mt-4 space-y-2">
        {products.map((p) => (
          <div key={p.id} className="premium-card flex items-center justify-between rounded-2xl px-4 py-3">
            <div>
              <p className="font-medium">
                {p.brand?.name} {p.model}
              </p>
              <p className="text-xs text-[#9CA3AF]">{formatProductSpec(p)}</p>
            </div>
            <span className={p.stock <= 5 ? "text-[#f07167]" : "text-[#3ddc97]"}>{p.stock} dona</span>
          </div>
        ))}
      </div>
    </div>
  );
}
