"use client";

import { useEffect, useState } from "react";
import { CategoryGrid } from "@/components/category/category-card";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, asList } from "@/lib/api/client";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>("/api/categories")
      .then((r) => setCategories(asList(r.categories)))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="px-4 pt-4">
      <h1 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em]">Kategoriyalar</h1>
      {error ? <ErrorState message={error} /> : null}
      {categories.length === 0 && !error ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <CategoryGrid categories={categories} />
      )}
    </div>
  );
}
