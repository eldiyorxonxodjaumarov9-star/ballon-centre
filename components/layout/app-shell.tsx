"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { SearchOverlay } from "@/components/search/search-overlay";
import { CustomerRegistrationModal } from "@/components/auth/customer-registration-modal";
import { ViewportSync } from "@/components/layout/viewport-sync";
import { useDismissKeyboardOnOutsidePointer } from "@/hooks/use-keyboard-dismiss";
import { Toaster } from "sonner";
import { useCart } from "@/hooks/use-cart";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isAdmin = pathname.startsWith("/admin");
  const [toastsReady, setToastsReady] = useState(false);
  useDismissKeyboardOnOutsidePointer(true);

  useEffect(() => {
    void useCart.persist.rehydrate();
    setToastsReady(true);
  }, []);

  return (
    <div className={isAdmin ? "min-h-dvh" : "mx-auto min-h-dvh w-full max-w-6xl"}>
      <ViewportSync />
      {isAdmin ? null : <Header />}
      <main className={isAdmin ? "" : "page-pad"}>
        <PageTransition>{children}</PageTransition>
      </main>
      {isAdmin ? null : <BottomNav />}
      {isAdmin ? null : <SearchOverlay />}
      {isAdmin ? null : <CustomerRegistrationModal />}
      {toastsReady ? (
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#16102e",
              border: "1px solid rgba(139,116,255,0.2)",
              color: "#fff",
            },
          }}
        />
      ) : null}
    </div>
  );
}
