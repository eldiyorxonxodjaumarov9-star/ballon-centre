"use client";

import Link from "next/link";
import type { Category } from "@/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <article className="premium-card relative overflow-hidden rounded-3xl p-4 transition duration-300 active:scale-[0.97] hover:shadow-[0_0_0_1px_rgba(139,116,255,0.4),0_12px_40px_rgba(63,42,155,0.18)]">
        <div className="absolute -right-6 -bottom-8 text-7xl opacity-20">{category.emoji}</div>
        <p className="text-2xl">{category.emoji}</p>
        <h3 className="mt-3 text-sm font-semibold tracking-wide">{category.nameUz}</h3>
        <p className="mt-1 text-xs text-[#9CA3AF]">{category.description}</p>
      </article>
    </Link>
  );
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
