"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Brand } from "@/types";
import { toast } from "sonner";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

  async function load() {
    const res = await fetch("/api/admin/brands");
    const data = await res.json();
    setBrands(data.brands ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country }),
    });
    if (!res.ok) return toast.error("Yaratilmadi");
    toast.success("Brend qo‘shildi");
    setName("");
    setCountry("");
    void load();
  }

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Brands</h1>
      <form onSubmit={create} className="mt-4 grid max-w-xl gap-2">
        <Input placeholder="Brend nomi" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Mamlakat" value={country} onChange={(e) => setCountry(e.target.value)} />
        <Button>Qo‘shish</Button>
      </form>
      <div className="mt-6 grid gap-2">
        {brands.map((b) => (
          <div key={b.id} className="premium-card rounded-2xl px-4 py-3">
            {b.name} <span className="text-xs text-[#9CA3AF]">{b.country}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
