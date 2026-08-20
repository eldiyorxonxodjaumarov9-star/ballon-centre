"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/category/category-card";
import { ProductGrid } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { apiFetch, asList } from "@/lib/api/client";
import type { Category, Product } from "@/types";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cats, items] = await Promise.all([
          apiFetch<{ categories: Category[] }>("/api/categories"),
          apiFetch<{ products: Product[] }>("/api/products?sort=popular"),
        ]);
        setCategories(asList(cats.categories));
        setProducts(asList(items.products).slice(0, 8));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ma'lumot yuklanmadi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <>
      <Hero />
      <section className="mt-8 px-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Kategoriyalar</h2>
          <Link href="/categories" className="text-xs text-[#c4b5ff]">
            Barchasi
          </Link>
        </div>
        {error ? <ErrorState message={error} /> : <CategoryGrid categories={categories} />}
      </section>
      <section className="mt-8 px-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Mahsulotlar</h2>
          <Link href="/catalog" className="text-xs text-[#c4b5ff]">
            Katalog
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon="🛞" title="Hali mahsulot yo‘q." description="Admin panelidan mahsulot qo‘shing." />
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </>
  );
}
