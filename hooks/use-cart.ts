import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity = 1) => {
        const items = get().items ?? [];
        const existing = items.find((item) => item.productId === product.id);
        if (existing) {
          set({
            items: items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || item.quantity + quantity) }
                : item,
            ),
          });
          return;
        }
        set({ items: [...items, { productId: product.id, product, quantity }] });
      },
      remove: (productId) => set({ items: (get().items ?? []).filter((item) => item.productId !== productId) }),
      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().remove(productId);
          return;
        }
        const items = get().items ?? [];
        const current = items.find((item) => item.productId === productId);
        const max = current?.product.stock || quantity;
        set({
          items: items.map((item) =>
            item.productId === productId ? { ...item, quantity: Math.min(quantity, max) } : item,
          ),
        });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "ballon-cart",
      skipHydration: true,
      merge: (persisted, current) => {
        const stored = persisted as Partial<CartState> | undefined;
        return {
          ...current,
          ...stored,
          items: Array.isArray(stored?.items) ? stored.items : current.items,
        };
      },
    },
  ),
);

export function cartCount(items: CartItem[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(items: CartItem[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
}
