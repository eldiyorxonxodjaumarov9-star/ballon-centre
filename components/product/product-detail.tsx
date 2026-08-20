"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { TireVisual } from "@/components/product/tire-visual";
import { ProductGallery } from "@/components/product/product-gallery";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { discountPercent, formatPrice, formatProductSpec, productKind } from "@/lib/utils";
import { SEASON_LABEL } from "@/lib/constants";
import { useCart } from "@/hooks/use-cart";
import { haptic } from "@/lib/telegram/webapp";

export function ProductDetail({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const size = formatProductSpec(product);
  const kind = productKind(product);
  const discount = discountPercent(product.price, product.oldPrice);
  const inStock = product.stock > 0;
  const images = (product.images ?? []).filter(Boolean).slice(0, 6);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;
    webApp.BackButton.show();
    const onBack = () => {
      if (galleryOpen) {
        setGalleryOpen(false);
        return;
      }
      router.back();
    };
    webApp.BackButton.onClick(onBack);
    return () => {
      webApp.BackButton.offClick(onBack);
      webApp.BackButton.hide();
    };
  }, [router, galleryOpen]);

  function addToCart() {
    add(product, qty);
    haptic("success");
    toast.success("Savatga qo‘shildi");
  }

  return (
    <div className="px-4 pt-3">
      <div className="premium-card overflow-hidden rounded-[28px]">
        <div className="relative">
          {images.length ? (
            <ProductGallery
              images={images}
              alt={product.model}
              open={galleryOpen}
              onOpenChange={setGalleryOpen}
              badge={
                discount ? (
                  <span className="absolute top-4 left-4 z-10 rounded-full bg-[#3f2a9b] px-2.5 py-1 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                ) : null
              }
            />
          ) : (
            <TireVisual brand={product.brand.name} model={product.model} size={size} season={product.season} variant={kind} className="aspect-[4/3]" />
          )}
          {discount && !images.length ? (
            <span className="absolute top-4 left-4 rounded-full bg-[#3f2a9b] px-2.5 py-1 text-xs font-bold text-white">
              -{discount}%
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c4b5ff]">{product.brand.name}</p>
      <h1 className="mt-1 text-2xl font-semibold">{product.model}</h1>
      <p className="mt-1 text-sm text-[#9CA3AF]">{size}</p>

      <div className="mt-4 flex items-end gap-3">
        <p className="text-3xl font-bold">{formatPrice(product.price)}</p>
        {product.oldPrice ? <p className="pb-1 text-sm text-[#9CA3AF] line-through">{formatPrice(product.oldPrice)}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {kind === "tire" ? <Badge>{SEASON_LABEL[product.season]}</Badge> : <Badge>{product.category.nameUz}</Badge>}
        <Badge className={inStock ? "" : "border-[#f07167]/40 text-[#f07167]"}>{inStock ? `Omborda: ${product.stock}` : "Tugagan"}</Badge>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#9CA3AF]">{product.description}</p>

      <div className="premium-card mt-5 grid grid-cols-2 gap-3 rounded-3xl p-4 text-sm">
        {kind === "battery" ? (
          <>
            <Spec label="Volt" value={/v/i.test(String(product.width)) ? String(product.width) : `${product.width}V`} />
            <Spec label="Sig‘im" value={/ah/i.test(String(product.profile)) ? String(product.profile) : `${product.profile}Ah`} />
            <Spec label="Tok (CCA)" value={product.loadIndex} />
            <Spec label="Qutblanish" value={product.speedIndex} />
          </>
        ) : kind === "rim" ? (
          <>
            <Spec label="Kenglik" value={/j/i.test(String(product.width)) ? String(product.width) : `${product.width}J`} />
            <Spec label="Diametr" value={/^r/i.test(String(product.diameter)) ? String(product.diameter) : `R${product.diameter}`} />
            <Spec label="PCD" value={product.loadIndex} />
            <Spec label="ET" value={product.speedIndex} />
          </>
        ) : (
          <>
            <Spec label="Kenglik" value={String(product.width)} />
            <Spec label="Profil" value={String(product.profile)} />
            <Spec label="Diametr" value={/^r/i.test(String(product.diameter)) ? String(product.diameter) : `R${product.diameter}`} />
            <Spec label="Mavsum" value={SEASON_LABEL[product.season]} />
          </>
        )}
        <Spec label="Ishlab chiqarilgan" value={product.country} />
      </div>

      <div className="mt-5 flex items-center justify-between rounded-3xl border border-white/8 bg-[#120a28] px-4 py-3">
        <span className="text-sm text-[#9CA3AF]">Miqdor</span>
        <QuantityStepper
          value={qty}
          min={1}
          max={Math.max(product.stock || 1, 1)}
          onChange={setQty}
        />
      </div>

      <div className="mt-4 grid gap-2">
        <Button disabled={!inStock} onClick={addToCart} className="uppercase tracking-[0.12em]">
          🛒 Savatga qo‘shish
        </Button>
        <Button
          disabled={!inStock}
          variant="outline"
          onClick={() => {
            addToCart();
            router.push("/checkout");
          }}
          className="uppercase tracking-[0.12em]"
        >
          ⚡ Hozir buyurtma berish
        </Button>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#9CA3AF]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
