"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/logo";
import { toast } from "sonner";

function LoginInner() {
  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/admin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Kirish rad etildi");
      router.replace(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xato");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4">
      <form onSubmit={submit} className="premium-card rounded-[28px] p-6">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>
        <p className="mt-4 text-center text-[11px] font-semibold tracking-[0.22em] text-[#c4b5ff] uppercase">Admin ilova</p>
        <h1 className="mt-2 text-center text-xl font-semibold">Kirish</h1>
        <p className="mt-1 mb-5 text-center text-sm text-[#9CA3AF]">Telefon raqam va parol bilan kiring</p>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Telefon raqam</label>
        <Input
          inputMode="tel"
          autoComplete="tel"
          placeholder="+998901234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <label className="mt-4 mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Parol</label>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Admin parol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button className="mt-5 w-full" disabled={loading}>
          {loading ? "Tekshirilmoqda..." : "Ilovani ochish"}
        </Button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
