"use client";

import { MessageCircle, Phone } from "lucide-react";
import { SUPPORT } from "@/lib/constants";
import { haptic, openTelegramLink } from "@/lib/telegram/webapp";

export default function HelpPage() {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-sm font-semibold uppercase tracking-[0.2em]">Yordam</h1>
      <p className="mt-2 mb-5 text-sm text-[#9CA3AF]">Savolingiz bormi? Biz bilan bog‘laning.</p>

      <button
        type="button"
        onClick={() => {
          haptic("medium");
          openTelegramLink(SUPPORT.telegramUrl);
        }}
        className="premium-card flex w-full items-center gap-4 rounded-[28px] p-5 text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(63,42,155,0.35)] text-[#c4b5ff]">
          <MessageCircle size={22} />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Telegram</span>
          <span className="mt-1 block text-base font-semibold text-white">{SUPPORT.telegramUsername}</span>
          <span className="mt-0.5 block text-xs text-[#c4b5ff]">Profilni ochish</span>
        </span>
      </button>

      <a
        href={`tel:${SUPPORT.phoneTel}`}
        onClick={() => haptic("medium")}
        className="premium-card mt-3 flex w-full items-center gap-4 rounded-[28px] p-5"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(63,42,155,0.35)] text-[#c4b5ff]">
          <Phone size={22} />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Telefon</span>
          <span className="mt-1 block text-base font-semibold tracking-wide text-white">{SUPPORT.phoneDisplay}</span>
          <span className="mt-0.5 block text-xs text-[#c4b5ff]">Qo‘ng‘iroq qilish</span>
        </span>
      </a>
    </div>
  );
}
