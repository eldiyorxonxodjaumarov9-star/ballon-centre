"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ProductGrid } from "@/components/product/product-card";
import { FilterDrawer } from "@/components/product/filter-drawer";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useSearchInputRef } from "@/hooks/use-search-input";
import { useDismissKeyboardOnUserScroll } from "@/hooks/use-keyboard-dismiss";
import { apiFetch, asList, filtersToQuery } from "@/lib/api/client";
import { blurActiveElement } from "@/lib/ui/keyboard";
import { useUi } from "@/hooks/use-ui";
import type { Brand, Category, Product, ProductFilters } from "@/types";

export default function CatalogPage() {
  const [filters, setFilters] = useState<ProductFilters>({ sort: "popular" });
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchOpen = useUi((s) => s.searchOpen);
  const setFilterOpen = useUi((s) => s.setFilterOpen);
  const { ref: searchInputRef } = useSearchInputRef(!searchOpen);
  const pageRef = useRef<HTMLDivElement>(null);

  useDismissKeyboardOnUserScroll(pageRef, true);

  useEffect(() => {
    void apiFetch<{ brands: Brand[] }>("/api/brands").then((r) => setBrands(asList(r.brands)));
    void apiFetch<{ categories: Category[] }>("/api/categories").then((r) => setCategories(asList(r.categories)));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        const q = query.trim() || undefined;
        if (prev.q === q) return prev;
        return { ...prev, q };
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiFetch<{ products: Product[] }>(`/api/products${filtersToQuery(filters)}`, { signal: controller.signal })
      .then((r) => {
        if (controller.signal.aborted) return;
        setProducts(asList(r.products));
        setError(null);
      })
      .catch((err) => {
        if (err.name === "AbortError" || controller.signal.aborted) return;
        setProducts([]);
        setError(err.message ?? "Katalog yuklanmadi");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  return (
    <div ref={pageRef} className="px-4 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em]">Katalog</h1>
        <button
          type="button"
          onPointerDown={() => blurActiveElement()}
          onClick={() => setFilterOpen(true)}
          className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-3 text-xs"
        >
          <SlidersHorizontal size={14} /> Filter
        </button>
      </div>
      <Input
        ref={searchInputRef}
        className="mt-4"
        placeholder="Michelin, 205/55 R16, R17..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        enterKeyHint="search"
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            blurActiveElement();
          }
        }}
      />
      <div className="mt-4">
        {error ? <ErrorState message={error} /> : null}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon="🔍" title="Bu bo‘yicha mahsulot topilmadi." description="Filterlarni o‘zgartirib ko‘ring." />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
      <FilterDrawer filters={filters} onChange={setFilters} brands={brands} categories={categories} />
    </div>
  );
}
