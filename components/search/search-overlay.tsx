"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRef } from "react";
import { useSearchInputRef } from "@/hooks/use-search-input";
import { useDismissKeyboardOnUserScroll } from "@/hooks/use-keyboard-dismiss";
import { useUi } from "@/hooks/use-ui";
import { blurActiveElement } from "@/lib/ui/keyboard";
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
  const { ref: inputRef } = useSearchInputRef(open);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useDismissKeyboardOnUserScroll(resultsRef, open);

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
          className="pointer-events-none fixed inset-x-0 top-0 z-50"
          style={{
            bottom: "calc(var(--nav-h) + var(--safe-bottom))",
            paddingTop: "calc(var(--header-h) + var(--safe-top))",
          }}
        >
          <div
            className="pointer-events-auto mx-auto flex h-full max-w-6xl flex-col bg-black/70 px-4 pt-3 backdrop-blur-md"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) blurActiveElement();
            }}
          >
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Michelin, 205/55 R16, R17..."
                enterKeyHint="search"
                autoComplete="off"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    blurActiveElement();
                  }
                }}
              />
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
              >
                <X size={18} />
              </button>
            </div>
            <div
              ref={resultsRef}
              className="mt-4 flex-1 overflow-y-auto pb-4"
            >
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
                        blurActiveElement();
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
