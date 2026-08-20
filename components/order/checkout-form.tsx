"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LocationPicker, type PickedLocation } from "@/components/order/location-picker";
import { useCart } from "@/hooks/use-cart";
import { apiFetch } from "@/lib/api/client";
import { useTelegram } from "@/lib/telegram/webapp";
import { DELIVERY_LABEL, PAYMENT_LABEL } from "@/lib/constants";
import { compressImage } from "@/lib/image/compress";
import { digitsOnly, formatCardNumber } from "@/lib/utils";
import type { DeliveryType, Order, PaymentCard, PaymentMethod } from "@/types";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">{label}</p>
      {children}
    </div>
  );
}

const needsReceipt = (method: PaymentMethod) => method === "CARD" || method === "TRANSFER";

export function CheckoutForm() {
  const items = useCart((s) => s.items) ?? [];
  const clear = useCart((s) => s.clear);
  const { user } = useTelegram();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [card, setCard] = useState<PaymentCard | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    customerName: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
    phone: "+998",
    note: "",
    deliveryType: "COURIER" as DeliveryType,
    paymentMethod: "CASH" as PaymentMethod,
  });

  useEffect(() => {
    void fetch("/api/payment-card")
      .then((r) => r.json())
      .then((d) => setCard(d.card ?? null))
      .catch(() => setCard(null));
  }, []);

  async function copyCardNumber() {
    if (!card) return;
    const text = digitsOnly(card.cardNumber);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Karta raqami nusxalandi");
    } catch {
      toast.error("Nusxa olinmadi");
    }
  }

  async function uploadReceipt(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const preview = URL.createObjectURL(file);
    setReceiptPreview(preview);
    try {
      const compressed = await compressImage(file);
      const data = new FormData();
      data.append("file", compressed);
      const res = await fetch("/api/upload/receipt", { method: "POST", body: data });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Chek yuklanmadi");
      setReceiptUrl(payload.url as string);
      toast.success("Chek yuklandi");
    } catch (error) {
      setReceiptPreview(null);
      setReceiptUrl(null);
      toast.error(error instanceof Error ? error.message : "Chek yuklanmadi");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!items.length) return;
    if (form.deliveryType === "COURIER" && !location) {
      toast.error("Xaritadan manzilni tanlang");
      return;
    }
    if (needsReceipt(form.paymentMethod) && !card) {
      toast.error("Karta raqami hali qo‘shilmagan");
      return;
    }
    if (needsReceipt(form.paymentMethod) && !receiptUrl) {
      toast.error("To‘lov chekini yuklang");
      return;
    }
    setLoading(true);
    try {
      const pickupAddress = "Do‘kondan olib ketish";
      const order = await apiFetch<Order>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          city: location?.city ?? "Toshkent",
          address:
            form.deliveryType === "PICKUP"
              ? pickupAddress
              : `${location?.address} (${location?.lat.toFixed(5)}, ${location?.lng.toFixed(5)})`,
          lat: location?.lat,
          lng: location?.lng,
          note: form.note,
          deliveryType: form.deliveryType,
          paymentMethod: form.paymentMethod,
          receiptUrl: receiptUrl ?? undefined,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      clear();
      router.push(`/order/success?n=${order.orderNumber}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Buyurtma yaratilmadi");
    } finally {
      setLoading(false);
    }
  }

  const paidOnline = needsReceipt(form.paymentMethod);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Field label="Ism">
        <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
      </Field>
      <Field label="Telefon raqam">
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
      </Field>
      <Field label="Yetkazib berish turi">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(DELIVERY_LABEL) as DeliveryType[]).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setForm({ ...form, deliveryType: type })}
              className={`h-12 rounded-2xl border text-sm ${
                form.deliveryType === type
                  ? "border-[rgba(139,116,255,0.55)] bg-[rgba(63,42,155,0.28)]"
                  : "border-white/10"
              }`}
            >
              {DELIVERY_LABEL[type]}
            </button>
          ))}
        </div>
      </Field>
      {form.deliveryType === "COURIER" ? (
        <Field label="Manzil (xarita)">
          <LocationPicker value={location} onChange={setLocation} />
        </Field>
      ) : null}
      <Field label="Izoh">
        <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </Field>
      <Field label="To‘lov usuli">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((method) => (
            <button
              type="button"
              key={method}
              onClick={() => setForm({ ...form, paymentMethod: method })}
              className={`h-12 rounded-2xl border text-sm ${
                form.paymentMethod === method
                  ? "border-[rgba(139,116,255,0.55)] bg-[rgba(63,42,155,0.28)]"
                  : "border-white/10"
              }`}
            >
              {PAYMENT_LABEL[method]}
            </button>
          ))}
        </div>
      </Field>

      {paidOnline ? (
        <>
          <div className="rounded-3xl border border-[rgba(139,116,255,0.35)] bg-[rgba(63,42,155,0.22)] p-4">
            {card ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c4b5ff]">Karta ma’lumoti</p>
                <p className="mt-3 text-lg font-semibold tracking-[0.08em]">{formatCardNumber(card.cardNumber)}</p>
                <p className="mt-1 text-sm text-[#c4b5ff]">
                  {card.firstName} {card.lastName}
                </p>
                <button
                  type="button"
                  onClick={() => void copyCardNumber()}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(139,116,255,0.45)] px-4 text-xs font-semibold"
                >
                  <Copy size={14} /> Karta raqamini nusxalash
                </button>
              </>
            ) : (
              <p className="text-sm text-[#9CA3AF]">Karta raqami hali qo‘shilmagan. Admin panelidan qo‘shing.</p>
            )}
          </div>
          <Field label="To‘lov cheki">
            {receiptPreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={receiptPreview} alt="Chek" className="max-h-48 w-full object-cover" />
                <button
                  type="button"
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70"
                  onClick={() => {
                    setReceiptPreview(null);
                    setReceiptUrl(null);
                  }}
                  aria-label="Chekni o‘chirish"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[rgba(139,116,255,0.45)] bg-[rgba(63,42,155,0.18)] text-center text-[12px] text-[#c4b5ff]">
                <ImagePlus size={22} />
                {uploading ? "Yuklanmoqda..." : "Chek rasmini yuklang"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    void uploadReceipt(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            )}
            <p className="mt-1.5 text-[11px] text-[#9CA3AF]">Kartaga to‘lov qilgach, chekni yuboring. Chek locatsiya bilan admin guruhiga ketadi.</p>
          </Field>
        </>
      ) : null}

      <Button
        disabled={
          loading ||
          uploading ||
          !items.length ||
          (form.deliveryType === "COURIER" && !location) ||
          (paidOnline && (!card || !receiptUrl))
        }
        className="w-full text-[13px] font-medium tracking-normal normal-case"
      >
        {loading ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
      </Button>
    </form>
  );
}
