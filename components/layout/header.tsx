"use client";

import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart, cartCount } from "@/hooks/use-cart";
import { useUi } from "@/hooks/use-ui";
import { blurActiveElement } from "@/lib/ui/keyboard";
import { haptic } from "@/lib/telegram/webapp";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/logo";

export function Header() {
  const items = useCart((s) => s.items) ?? [];
  const count = cartCount(items);
  const searchOpen = useUi((s) => s.searchOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);

  function openSearch() {
    haptic("light");
    setSearchOpen(true);
  }

  function leaveSearch() {
    blurActiveElement();
    if (searchOpen) setSearchOpen(false);
  }

  return (
    <header
      className={cn("sticky top-0 z-40 glass px-3", searchOpen && "z-[60]")}
      style={{ paddingTop: "max(8px, var(--safe-top))" }}
    >
      <div className="flex h-14 items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center" onClick={() => { leaveSearch(); haptic("light"); }}>
          <BrandLogo size="sm" className="shadow-[0_8px_24px_rgba(63,42,155,0.35)]" />
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Qidiruv"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/6"
            onClick={openSearch}
          >
            <Search size={18} />
          </button>
          <Link
            href="/cart"
            aria-label="Savat"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/6"
            onClick={() => { leaveSearch(); haptic("light"); }}
          >
            <ShoppingBag size={18} />
            {count > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-[#3f2a9b]">
                {count}
              </span>
            ) : null}
          </Link>
          <Link
            href="/profile"
            aria-label="Profil"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/6"
            onClick={() => { leaveSearch(); haptic("light"); }}
          >
            <User size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
