"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { haptic } from "@/lib/telegram/webapp";

type ProductGalleryProps = {
  images: string[];
  alt: string;
  badge?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function GalleryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[#120a28] text-4xl ${className ?? ""}`} aria-hidden>
        🛞
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}

export function ProductGallery({ images, alt, badge, open, onOpenChange }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const total = images.length;
  const current = images[Math.min(index, Math.max(total - 1, 0))];

  useEffect(() => setMounted(true), []);
  useScrollLock(open);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (total < 2) return;
      setIndex((prev) => (prev + dir + total) % total);
      haptic("light");
    },
    [total],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go, onOpenChange]);

  function onSwipe(startX: number, endX: number) {
    const dx = endX - startX;
    if (dx > 40) go(-1);
    else if (dx < -40) go(1);
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="relative block aspect-[4/3] w-full overflow-hidden bg-[#0c0818]"
          onClick={() => {
            haptic("light");
            onOpenChange(true);
          }}
          aria-label="Rasmni ochish"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <GalleryImage src={current} alt={alt} className="absolute inset-0 h-full w-full object-contain p-2" />
        </button>
        {badge}
        {total > 1 ? (
          <>
            <NavButton side="left" onClick={() => go(-1)} className="absolute top-1/2 left-2 z-10 -translate-y-1/2" />
            <NavButton side="right" onClick={() => go(1)} className="absolute top-1/2 right-2 z-10 -translate-y-1/2" />
            <Dots total={total} index={index} onSelect={setIndex} />
          </>
        ) : null}
      </div>

      {mounted && open && current
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Rasmlar">
              <div className="flex items-center justify-between px-3 pt-3" style={{ paddingTop: "max(12px, var(--safe-top))" }}>
                <p className="text-sm font-medium text-white/80">
                  {index + 1} / {total}
                </p>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                  onClick={() => onOpenChange(false)}
                  aria-label="Yopish"
                >
                  <X size={20} />
                </button>
              </div>

              <LightboxStage src={current} alt={alt} onSwipe={onSwipe} />

              {total > 1 ? (
                <>
                  <NavButton
                    side="left"
                    onClick={() => go(-1)}
                    className="absolute top-1/2 left-2 z-10 -translate-y-1/2 md:left-4"
                  />
                  <NavButton
                    side="right"
                    onClick={() => go(1)}
                    className="absolute top-1/2 right-2 z-10 -translate-y-1/2 md:right-4"
                  />
                </>
              ) : null}

              {total > 1 ? (
                <div
                  className="flex justify-center gap-1.5 overflow-x-auto px-4 pb-6"
                  style={{ paddingBottom: "max(24px, var(--safe-bottom))" }}
                >
                  {images.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border ${
                        i === index ? "border-white" : "border-white/20 opacity-70"
                      }`}
                    >
                      <GalleryImage src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function LightboxStage({
  src,
  alt,
  onSwipe,
}: {
  src: string;
  alt: string;
  onSwipe: (startX: number, endX: number) => void;
}) {
  const [startX, setStartX] = useState<number | null>(null);

  return (
    <div
      className="flex min-h-0 flex-1 items-center justify-center px-12"
      onTouchStart={(e) => setStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (startX == null) return;
        onSwipe(startX, e.changedTouches[0].clientX);
        setStartX(null);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <GalleryImage src={src} alt={alt} className="max-h-full max-w-full object-contain" />
    </div>
  );
}

function NavButton({
  side,
  onClick,
  className,
}: {
  side: "left" | "right";
  onClick: () => void;
  className?: string;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm ${className ?? ""}`}
      aria-label={side === "left" ? "Oldingi rasm" : "Keyingi rasm"}
    >
      <Icon size={22} />
    </button>
  );
}

function Dots({ total, index, onSelect }: { total: number; index: number; onSelect: (i: number) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(i);
          }}
          className={`h-1.5 rounded-full transition ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/45"}`}
          aria-label={`${i + 1}-rasm`}
        />
      ))}
    </div>
  );
}
