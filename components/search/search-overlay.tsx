"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useUi } from "@/hooks/use-ui";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, asList } from "@/lib/api/client";
import type { Product } from "@/types";

export function SearchOverlay() {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const payload = await apiFetch<{ products: Product[] }>(
        `/api/products${query ? `?q=${encodeURIComponent(query)}` : ""}`,
        { signal: controller.signal },
      );
      setProducts(asList(payload.products));
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const visible = useMemo(() => products.slice(0, 8), [products]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pt-4" style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}>
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Michelin, 205/55 R16, R17..."
              />
              <button
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto pb-8">
              {query && visible.length === 0 ? (
                <EmptyState
                  icon="🔍"
                  title="Bu bo‘yicha mahsulot topilmadi."
                  description="Filterlarni o‘zgartirib ko‘ring."
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {visible.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setOpen(false);
                        router.push(`/product/${product.slug}`);
                      }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
