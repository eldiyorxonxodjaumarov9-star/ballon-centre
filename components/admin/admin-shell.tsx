"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, PlusCircle, ShoppingBag, LogOut, CreditCard } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TABS = [
  { href: "/admin", label: "Bosh", icon: LayoutDashboard },
  { href: "/admin/products", label: "Mahsulot", icon: Package },
  { href: "/admin/products/new", label: "Qo‘shish", icon: PlusCircle },
  { href: "/admin/orders", label: "Zakaz", icon: ShoppingBag },
  { href: "/admin/settings", label: "Karta", icon: CreditCard },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-[#0a0618] text-white">
      <header className="sticky top-0 z-40 glass flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#c4b5ff] uppercase">Admin</p>
            <p className="text-sm font-semibold">Ballon Shop</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#9CA3AF]"
          aria-label="Chiqish"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="page-pad px-4 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 glass" style={{ paddingBottom: "var(--safe-bottom)" }}>
        <div className="mx-auto grid h-[72px] max-w-lg grid-cols-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active =
              tab.href === "/admin"
                ? pathname === "/admin"
                : tab.href === "/admin/products"
                  ? pathname === "/admin/products" || pathname.startsWith("/admin/products/") && !pathname.endsWith("/new")
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-[10px]",
                  active ? "text-[#c4b5ff]" : "text-[#b7b0d0]",
                )}
              >
                {active ? <span className="absolute top-2 h-1 w-5 rounded-full bg-[#8b74ff]" /> : null}
                <Icon size={18} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
