"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Layers, ShoppingBag, User } from "lucide-react";
import { useCart, cartCount } from "@/hooks/use-cart";
import { haptic } from "@/lib/telegram/webapp";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Bosh sahifa", icon: Home },
  { href: "/catalog", label: "Katalog", icon: LayoutGrid },
  { href: "/categories", label: "Kategoriyalar", icon: Layers },
  { href: "/cart", label: "Savat", icon: ShoppingBag },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const count = cartCount(useCart((s) => s.items));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 glass"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="grid h-[72px] grid-cols-5">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => haptic("light")}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 text-[10px] tracking-wide",
                active ? "text-[#c4b5ff]" : "text-[#b7b0d0]",
              )}
            >
              {active ? <span className="absolute top-2 h-1 w-5 rounded-full bg-[#8b74ff]" /> : null}
              <span className="relative">
                <Icon size={18} />
                {tab.href === "/cart" && count > 0 ? (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-0.5 text-[8px] font-bold text-[#3f2a9b]">
                    {count}
                  </span>
                ) : null}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
