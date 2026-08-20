"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductDetailSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api/client";
import type { Product } from "@/types";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ product: Product }>(`/api/products/${params.slug}`)
      .then((r) => setProduct(r.product))
      .catch((err) => setError(err.message));
  }, [params.slug]);

  if (error) return <div className="pt-8"><ErrorState message={error} /></div>;
  if (!product) return <ProductDetailSkeleton />;
  return <ProductDetail product={product} />;
}
