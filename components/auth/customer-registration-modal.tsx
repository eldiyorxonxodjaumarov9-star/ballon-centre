"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/http";
import { normalizeUzPhone } from "@/lib/phone";
import { haptic, useTelegram } from "@/lib/telegram/webapp";

type MeResponse = {
  user: {
    telegramId: string;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    phone?: string | null;
  } | null;
  registered: boolean;
};

export function CustomerRegistrationModal() {
  const { ready, isTelegram, user, viewportHeight } = useTelegram();
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!isTelegram) {
      setChecking(false);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    void apiFetch<MeResponse>("/api/users/me")
      .then((data) => {
        if (cancelled) return;
        setFirstName((prev) => prev || user?.first_name || data.user?.firstName || "");
        setOpen(!data.registered);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setOpen(true);
        setFirstName((prev) => prev || user?.first_name || "");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, isTelegram, user?.first_name]);

  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, [open]);

  useEffect(() => {
    if (!open && !checking) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, checking]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = firstName.trim();
    if (name.length < 2 || name.length > 80) {
      toast.error("Ism 2–80 belgi oralig‘ida bo‘lsin");
      return;
    }
    if (!normalizeUzPhone(phone)) {
      toast.error("Telefon raqami noto‘g‘ri. Masalan: +998 90 123 45 67");
      return;
    }

    setSaving(true);
    try {
      await apiFetch<MeResponse>("/api/users/me", {
        method: "POST",
        body: JSON.stringify({ firstName: name, phone }),
      });
      haptic("success");
      toast.success("Akkauntingiz muvaffaqiyatli ochildi");
      setOpen(false);
    } catch (error) {
      haptic("error");
      toast.error(error instanceof ApiError ? error.message : "Akkaunt ochilmadi");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !isTelegram) return null;
  if (!checking && !open) return null;

  const viewport = viewportHeight || (typeof window !== "undefined" ? window.innerHeight : 640);
  const sheetMax = Math.max(280, viewport - keyboardInset - 24);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#05030f]/72 px-3 sm:items-center"
      style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 8 : undefined }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-reg-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") e.preventDefault();
      }}
    >
      <div className="absolute inset-0" aria-hidden />
      <div
        className="relative z-10 w-full max-w-md overflow-y-auto rounded-[28px] border border-[rgba(139,116,255,0.28)] bg-[linear-gradient(165deg,#1a1236_0%,#120a28_55%,#0c081c_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        style={{ maxHeight: sheetMax }}
      >
        {checking ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(139,116,255,0.25)] border-t-[#8b74ff]" />
            <p className="text-sm text-[#9CA3AF]">Akkaunt tekshirilmoqda...</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(139,116,255,0.35)] bg-[rgba(63,42,155,0.28)] text-2xl">
                🛞
              </div>
              <h2 id="customer-reg-title" className="text-xl font-semibold tracking-tight text-white">
                Ballon Shop’ga xush kelibsiz!
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#b7b0d0]">
                Buyurtma berish va buyurtmalaringizni kuzatish uchun ma’lumotlaringizni kiriting.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Ismingiz</p>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ismingiz"
                autoComplete="name"
                required
                maxLength={80}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                Telefon raqamingiz
              </p>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>

            <Button type="submit" className="mt-1 w-full" disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Akkaunt ochish"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
