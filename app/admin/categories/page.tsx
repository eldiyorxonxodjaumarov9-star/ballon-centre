"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ nameUz: "", emoji: "🚗", description: "" });

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return toast.error("Yaratilmadi");
    toast.success("Kategoriya qo‘shildi");
    setForm({ nameUz: "", emoji: "🚗", description: "" });
    void load();
  }

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Categories</h1>
      <form onSubmit={create} className="mt-4 grid max-w-xl gap-2">
        <Input placeholder="Nomi" value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
        <Input placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <Input placeholder="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Button>Qo‘shish</Button>
      </form>
      <div className="mt-6 grid gap-2">
        {categories.map((c) => (
          <div key={c.id} className="premium-card rounded-2xl px-4 py-3">
            {c.emoji} {c.nameUz}
          </div>
        ))}
      </div>
    </div>
  );
}
