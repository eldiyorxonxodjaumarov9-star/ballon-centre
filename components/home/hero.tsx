"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";

export function Hero() {
  return (
    <section className="relative mx-4 mt-3 overflow-hidden rounded-[28px] border border-[rgba(167,139,255,0.2)] bg-[#3f2a9b]">
      <div className="tread-bg absolute inset-0 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(196,181,255,0.22),transparent_34%),linear-gradient(180deg,rgba(10,6,24,0.08),rgba(10,6,24,0.35))]" />
      <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-11">
        <BrandLogo size="lg" className="ring-2 ring-white/15 drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]" />
        <h1 className="mt-6 max-w-sm text-[26px] leading-[1.12] font-bold tracking-tight text-white italic uppercase sm:text-4xl">
          Avtomobilingiz uchun
          <br />
          mukammal ballon
        </h1>
        <p className="mt-3 max-w-[18rem] text-[13px] leading-snug tracking-wide text-[#e8e0ff] sm:max-w-md sm:text-sm">
          Avtomobilingiz uchun xohlagan turdagi shinalar olami.
          <br />
          To‘g‘ridan-to‘g‘ri distribyutordan!
        </p>
        <div className="mt-4 inline-flex max-w-full items-center rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/95 backdrop-blur-sm">
          🚚 Yetkazib berish bepul
        </div>
        <Link href="/catalog" className="mt-5 inline-flex">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[12px] font-semibold tracking-[0.14em] text-[#3f2a9b] uppercase active:scale-[0.98]">
            Mahsulotlarni ko‘rish
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>
    </section>
  );
}
