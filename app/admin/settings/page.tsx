"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { digitsOnly, formatCardNumber, groupThousands } from "@/lib/utils";
import type { PaymentCard } from "@/types";

const emptyForm = {
  cardNumber: "",
  firstName: "",
  lastName: "",
};

export default function AdminSettingsPage() {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [usdRate, setUsdRate] = useState("12500");
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kartalar yuklanmadi");
      setCards(Array.isArray(data.cards) ? data.cards : []);
      if (data.usdRate) setUsdRate(String(data.usdRate));
    } catch {
      setCards([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        cardNumber: digitsOnly(form.cardNumber),
        firstName: form.firstName,
        lastName: form.lastName,
      };
      const res = await fetch("/api/admin/settings", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Saqlanmadi");
      toast.success(editingId ? "Karta yangilandi" : "Karta qo‘shildi");
      resetForm();
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saqlanmadi");
    } finally {
      setSaving(false);
    }
  }

  async function activate(id: string) {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "activate" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Faollashtirilmadi");
      return;
    }
    toast.success("Karta faollashtirildi");
    void load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/settings?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "O‘chirilmadi");
      return;
    }
    toast.success("Karta o‘chirildi");
    if (editingId === id) resetForm();
    void load();
  }

  async function saveRate() {
    setSavingRate(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "usdRate", usdRate: Number(digitsOnly(usdRate)) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kurs saqlanmadi");
      setUsdRate(String(data.usdRate));
      toast.success("Dollar kursi saqlandi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kurs saqlanmadi");
    } finally {
      setSavingRate(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Sozlamalar</h1>

      <div className="premium-card mt-4 space-y-4 rounded-3xl p-5">
        <p className="text-sm text-[#9CA3AF]">Mahsulot narxini dollarda yozganda shu kurs ishlatiladi.</p>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">1$ = so‘m</p>
          <Input
            inputMode="numeric"
            placeholder="12500"
            value={groupThousands(usdRate)}
            onChange={(e) => setUsdRate(digitsOnly(e.target.value))}
          />
        </div>
        <Button type="button" className="w-full" disabled={savingRate} onClick={() => void saveRate()}>
          {savingRate ? "Saqlanmoqda..." : "Kursni saqlash"}
        </Button>
      </div>

      <form
        className="premium-card mt-4 space-y-4 rounded-3xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <p className="text-sm text-[#9CA3AF]">
          {editingId ? "Kartani tahrirlang." : "Yangi karta qo‘shing. Faol karta mijozga ko‘rinadi."}
        </p>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Karta raqami</p>
          <Input
            inputMode="numeric"
            placeholder="8600 1234 5678 9012"
            value={formatCardNumber(form.cardNumber)}
            onChange={(e) => setForm({ ...form, cardNumber: digitsOnly(e.target.value).slice(0, 16) })}
            required
          />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Ism</p>
          <Input placeholder="Ism" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Familiya</p>
          <Input placeholder="Familiya" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Bekor qilish
            </Button>
          ) : null}
          <Button className={editingId ? "" : "col-span-2"} disabled={saving}>
            {saving ? "Saqlanmoqda..." : editingId ? "O‘zgarishlarni saqlash" : "Kartani saqlash"}
          </Button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {cards.length === 0 ? <p className="text-sm text-[#9CA3AF]">Hali karta qo‘shilmagan.</p> : null}
        {cards.map((card) => (
          <article
            key={card.id}
            className={`premium-card rounded-3xl p-4 ${card.isActive ? "border border-[rgba(139,116,255,0.45)]" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tracking-[0.08em]">{formatCardNumber(card.cardNumber)}</p>
                <p className="mt-1 text-sm text-[#c4b5ff]">
                  {card.firstName} {card.lastName}
                </p>
              </div>
              {card.isActive ? (
                <span className="rounded-full bg-[rgba(63,42,155,0.35)] px-2.5 py-1 text-[10px] font-semibold text-[#c4b5ff]">
                  Faol
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!card.isActive ? (
                <button
                  type="button"
                  onClick={() => void activate(card.id)}
                  className="rounded-full border border-[rgba(139,116,255,0.45)] px-3 py-1.5 text-xs font-semibold text-[#c4b5ff]"
                >
                  Faollashtirish
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setEditingId(card.id);
                  setForm({
                    cardNumber: card.cardNumber,
                    firstName: card.firstName,
                    lastName: card.lastName,
                  });
                }}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold"
              >
                Tahrirlash
              </button>
              <button
                type="button"
                onClick={() => void remove(card.id)}
                className="rounded-full border border-[#f07167]/40 px-3 py-1.5 text-xs font-semibold text-[#f07167]"
              >
                O‘chirish
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
