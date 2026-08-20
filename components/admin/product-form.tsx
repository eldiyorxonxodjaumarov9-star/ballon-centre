"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { MoneyInput, type MoneyCurrency } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { formatPrice, groupThousands } from "@/lib/utils";
import type { Category, Product, Season } from "@/types";

const MAX_IMAGES = 6;

const empty = {
  name: "",
  model: "",
  brandName: "",
  categoryId: "",
  description: "",
  price: "",
  oldPrice: "",
  stock: "",
  width: "",
  profile: "",
  diameter: "",
  season: "SUMMER" as Season,
};

const selectClass = "h-12 w-full rounded-2xl border border-white/10 bg-[#120a28] px-4 text-sm text-white outline-none";
const numberClass =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">{label}</p>
      {children}
    </div>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const [form, setForm] = useState({
    ...empty,
    name: product?.name ?? "",
    model: product?.model ?? "",
    brandName: product?.brand.name ?? "",
    categoryId: product?.categoryId ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    oldPrice: product?.oldPrice ? String(product.oldPrice) : "",
    stock: product ? String(product.stock) : "",
    width: product ? String(product.width) : "",
    profile: product ? String(product.profile) : "",
    diameter: product ? String(product.diameter) : "",
    season: product?.season ?? "SUMMER",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState<MoneyCurrency>("UZS");
  const [usdRate, setUsdRate] = useState("12500");
  const router = useRouter();

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const kind =
    selectedCategory?.slug === "akkumulyatorlar"
      ? "battery"
      : selectedCategory?.slug === "disklar"
        ? "rim"
        : "tire";

  const rate = Math.max(1, Number(usdRate) || 12500);
  const toSom = (value: string) => {
    if (!value) return 0;
    if (currency === "USD") return Math.round(Number(value) * rate);
    return Math.round(Number(value));
  };

  useEffect(() => {
    void fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
    void fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.usdRate) setUsdRate(String(d.usdRate));
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const brandName = form.brandName.trim();
    if (!brandName) {
      toast.error("Brend nomini kiriting");
      return;
    }
    const price = toSom(form.price);
    if (!price || price <= 0) {
      toast.error("Narxni to‘g‘ri kiriting");
      return;
    }
    setSaving(true);
    if (currency === "USD") {
      void fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "usdRate", usdRate: rate }),
      });
    }
    const payload = {
      name: form.name || form.model,
      model: form.model,
      brandName,
      categoryId: form.categoryId,
      description: form.description,
      images: images.slice(0, MAX_IMAGES),
      price,
      oldPrice: form.oldPrice ? toSom(form.oldPrice) : null,
      stock: Number(form.stock || 0),
      width: (form.width || "—").trim(),
      profile: (form.profile || "—").trim(),
      diameter: (form.diameter || "—").trim(),
      season: form.season,
      loadIndex: kind === "battery" ? "CCA" : "91",
      speedIndex: kind === "rim" ? "ET" : "V",
      country: "O‘zbekiston",
      warranty: "2 yil",
      featured: false,
      isActive: true,
    };
    const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Saqlanmadi");
      return;
    }
    toast.success("Mahsulot saqlandi");
    router.push("/admin/products");
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error("Maksimal 6 ta rasm yuklash mumkin");
      return;
    }
    const picked = Array.from(files);
    const selected = picked.slice(0, remaining);
    if (picked.length > remaining) {
      toast.message(`Faqat ${remaining} ta rasm qo‘shildi. Maksimal 6 ta.`);
    }
    const previews = selected.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...previews].slice(0, MAX_IMAGES));
    setUploading(true);
    try {
      const compressed = await Promise.all(selected.map((file) => compressImage(file)));
      const data = new FormData();
      compressed.forEach((file) => data.append("files", file));
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Rasm yuklanmadi");
      const urls = ((payload.urls as string[]) ?? []).slice(0, remaining);
      setImages((prev) => {
        const withoutPreview = prev.filter((src) => !previews.includes(src));
        return [...withoutPreview, ...urls].slice(0, MAX_IMAGES);
      });
      toast.success(urls.length === 1 ? "Rasm qo‘shildi" : `${urls.length} ta rasm qo‘shildi`);
    } catch (error) {
      setImages((prev) => prev.filter((src) => !previews.includes(src)));
      toast.error(error instanceof Error ? error.message : "Rasm yuklanmadi");
    } finally {
      previews.forEach((src) => URL.revokeObjectURL(src));
      setUploading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label={`Mahsulot rasmi (${images.length}/${MAX_IMAGES})`}>
        <div className="grid grid-cols-3 gap-2">
          {images.map((src) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#0c0818]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-contain p-1" />
              <button
                type="button"
                className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70"
                onClick={() => setImages((prev) => prev.filter((item) => item !== src))}
                aria-label="Rasmni o‘chirish"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES ? (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[rgba(139,116,255,0.45)] bg-[rgba(63,42,155,0.18)] text-center text-[11px] text-[#c4b5ff]">
              <ImagePlus size={22} />
              {uploading ? "Yuklanmoqda..." : "Rasm qo‘shish"}
              <input
                type="file"
                accept="image/*"
                multiple={images.length < MAX_IMAGES - 1}
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void uploadImages(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
        <p className="mt-1.5 text-[11px] text-[#9CA3AF]">1 tadan 6 tagacha rasm yuklash mumkin.</p>
      </Field>
      <Field label="Model">
        <Input placeholder="Masalan: Primacy 4+" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
      </Field>
      <Field label="Brend">
        <Input
          placeholder="Masalan: Michelin"
          value={form.brandName}
          onChange={(e) => setForm({ ...form, brandName: e.target.value })}
          required
        />
      </Field>
      <Field label="Kategoriya">
        <select className={selectClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
          <option value="">Kategoriyani tanlang</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.nameUz}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valyuta">
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "UZS" as const, label: "So‘m" },
              { id: "USD" as const, label: "Dollar ($)" },
            ]).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setCurrency(item.id);
                  setForm((prev) => ({ ...prev, price: "", oldPrice: "" }));
                }}
                className={`h-12 rounded-2xl border text-sm ${
                  currency === item.id
                    ? "border-[rgba(139,116,255,0.55)] bg-[rgba(63,42,155,0.28)]"
                    : "border-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Field>
        {currency === "USD" ? (
          <Field label="1$ = so‘m">
            <Input
              inputMode="numeric"
              className={numberClass}
              placeholder="12500"
              value={groupThousands(usdRate)}
              onChange={(e) => setUsdRate(e.target.value.replace(/\D/g, ""))}
              required
            />
          </Field>
        ) : (
          <div />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Narx">
          <MoneyInput
            required
            currency={currency}
            placeholder={currency === "USD" ? "100" : "1 250 000"}
            value={form.price}
            onChange={(price) => setForm({ ...form, price })}
          />
        </Field>
        <Field label="Eski narx">
          <MoneyInput
            currency={currency}
            placeholder="Ixtiyoriy"
            value={form.oldPrice}
            onChange={(oldPrice) => setForm({ ...form, oldPrice })}
          />
        </Field>
      </div>
      {currency === "USD" && form.price ? (
        <p className="text-xs text-[#9CA3AF]">
          Saqlanadi: {formatPrice(toSom(form.price))}
          {form.oldPrice ? ` · eski: ${formatPrice(toSom(form.oldPrice))}` : ""}
        </p>
      ) : null}
      <Field label="Ombordagi soni">
        <Input className={numberClass} type="number" inputMode="numeric" placeholder="Nechta bor" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
      </Field>

      {kind === "tire" ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Kenglik">
              <Input placeholder="205 yoki LT" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
            </Field>
            <Field label="Profil">
              <Input placeholder="55 yoki C" value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })} />
            </Field>
            <Field label="Diametr">
              <Input placeholder="16 yoki 16C" value={form.diameter} onChange={(e) => setForm({ ...form, diameter: e.target.value })} />
            </Field>
          </div>
          <Field label="Mavsum">
            <select className={selectClass} value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value as Season })}>
              <option value="SUMMER">Yozgi</option>
              <option value="WINTER">Qishki</option>
              <option value="ALL_SEASON">4 fasl</option>
            </select>
          </Field>
        </>
      ) : null}

      {kind === "battery" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Volt">
            <Input placeholder="12 yoki 12V" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
          </Field>
          <Field label="Sig‘im (Ah)">
            <Input placeholder="60 yoki 60Ah" value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })} />
          </Field>
        </div>
      ) : null}

      {kind === "rim" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kenglik (J)">
            <Input placeholder="6.5 yoki 6.5J" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
          </Field>
          <Field label="Diametr">
            <Input placeholder="16 yoki R16" value={form.diameter} onChange={(e) => setForm({ ...form, diameter: e.target.value })} />
          </Field>
        </div>
      ) : null}

      <Field label="Tavsif">
        <Textarea placeholder="Qisqa ma’lumot" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Button className="mt-1 w-full" disabled={saving || uploading}>
        {saving ? "Saqlanmoqda..." : "Mahsulotni saqlash"}
      </Button>
    </form>
  );
}
