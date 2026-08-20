"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Discount {
  id: string;
  name: string;
  percent?: number | null;
  isActive: boolean;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [name, setName] = useState("");
  const [percent, setPercent] = useState(10);

  async function load() {
    const res = await fetch("/api/admin/discounts");
    const data = await res.json();
    setDiscounts(data.discounts ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, percent }),
    });
    if (!res.ok) return toast.error("Yaratilmadi");
    toast.success("Chegirma qo‘shildi");
    void load();
  }

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Discounts</h1>
      <form onSubmit={create} className="mt-4 grid max-w-xl gap-2">
        <Input placeholder="Nomi" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" placeholder="%" value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
        <Button>Qo‘shish</Button>
      </form>
      <div className="mt-6 grid gap-2">
        {discounts.map((d) => (
          <div key={d.id} className="premium-card rounded-2xl px-4 py-3">
            {d.name} {d.percent ? `· ${d.percent}%` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
