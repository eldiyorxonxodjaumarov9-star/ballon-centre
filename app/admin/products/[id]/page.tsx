"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import type { Product } from "@/types";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProduct((d.products as Product[]).find((p) => p.id === params.id) ?? null));
  }, [params.id]);

  if (!product) return <p className="text-sm text-[#9CA3AF]">Yuklanmoqda...</p>;

  return (
    <div>
      <h1 className="mb-4 text-sm font-semibold tracking-[0.2em] uppercase">Mahsulotni tahrirlash</h1>
      <ProductForm product={product} />
    </div>
  );
}
