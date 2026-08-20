"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductGrid } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { apiFetch, asList } from "@/lib/api/client";
import type { Category, Product } from "@/types";

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [cats, items] = await Promise.all([
          apiFetch<{ categories: Category[] }>("/api/categories"),
          apiFetch<{ products: Product[] }>(`/api/products?category=${params.slug}`),
        ]);
        setCategory(asList(cats.categories).find((c) => c.slug === params.slug) ?? null);
        setProducts(asList(items.products));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yuklanmadi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.slug]);

  return (
    <div className="px-4 pt-4">
      <p className="text-2xl">{category?.emoji}</p>
      <h1 className="mt-2 text-xl font-semibold">{category?.nameUz ?? "Kategoriya"}</h1>
      <p className="mt-1 mb-4 text-sm text-[#9CA3AF]">{category?.description}</p>
      {error ? <ErrorState message={error} /> : null}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon="🛞" title="Bu kategoriyada mahsulot yo‘q." />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
