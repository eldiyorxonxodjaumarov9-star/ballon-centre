"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function SuccessInner() {
  const params = useSearchParams();
  const n = params.get("n") ?? "000000";

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(139,116,255,0.45)] bg-[rgba(63,42,155,0.22)] text-3xl text-[#c4b5ff]">
        ✓
      </div>
      <h1 className="mt-6 text-xl font-bold tracking-[0.12em] uppercase">Buyurtmangiz qabul qilindi</h1>
      <p className="mt-3 text-sm text-[#c4b5ff]">Buyurtma raqami: #{n}</p>
      <p className="mt-2 max-w-xs text-sm text-[#9CA3AF]">Tez orada operatorimiz siz bilan bog‘lanadi.</p>
      <Button asChild className="mt-8 uppercase tracking-[0.14em]">
        <Link href="/">Do‘konga qaytish</Link>
      </Button>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
