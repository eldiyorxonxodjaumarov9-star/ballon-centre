"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types";
import { toast } from "sonner";

type CategoryRow = Category & { productCount: number };

const emptyForm = {
  nameUz: "",
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nameUz = form.nameUz.trim();
    if (!nameUz) {
      toast.error("Kategoriya nomini kiriting");
      return;
    }

    setSaving(true);
    const payload = { nameUz, isActive: form.isActive };
    const res = await fetch(editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Saqlanmadi");
      return;
    }

    toast.success(editingId ? "Kategoriya yangilandi" : "Kategoriya qo‘shildi");
    resetForm();
    void load();
  }

  function startEdit(category: CategoryRow) {
    setEditingId(category.id);
    setForm({ nameUz: category.nameUz, isActive: category.isActive });
  }

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Kategoriyalar</h1>

      <form onSubmit={submit} className="premium-card mt-4 grid gap-3 rounded-3xl p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
          {editingId ? "Kategoriyani tahrirlash" : "Kategoriya qo‘shish"}
        </p>
        <Input
          placeholder="Masalan: Avtoaksessuarlar"
          value={form.nameUz}
          onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
          required
          maxLength={80}
        />
        {!editingId && form.nameUz.trim() ? (
          <p className="text-xs text-[#9CA3AF]">Slug: {slugify(form.nameUz.trim())}</p>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-[#b7b0d0]">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-white/20"
          />
          Faol
        </label>
        <div className="grid grid-cols-2 gap-2">
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Bekor qilish
            </Button>
          ) : (
            <div />
          )}
          <Button disabled={saving}>{saving ? "Saqlanmoqda..." : editingId ? "Saqlash" : "Qo‘shish"}</Button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Hali kategoriya yo‘q.</p>
        ) : null}
        {categories.map((category) => (
          <article key={category.id} className="premium-card rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {category.emoji} {category.nameUz}
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Mahsulotlar: {category.productCount} · Slug: {category.slug}
                </p>
                <p className={`mt-1 text-xs ${category.isActive ? "text-[#3ddc97]" : "text-[#f07167]"}`}>
                  {category.isActive ? "Faol" : "Nofaol"}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs text-[#c4b5ff]"
                onClick={() => startEdit(category)}
              >
                Tahrirlash
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
