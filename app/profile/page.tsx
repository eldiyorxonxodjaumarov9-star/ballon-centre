"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, HelpCircle, MapPin, Package, Settings } from "lucide-react";
import { SUPPORT } from "@/lib/constants";
import { haptic, openTelegramLink, useTelegram } from "@/lib/telegram/webapp";

const LINKS = [
  { href: "/orders", label: "Mening buyurtmalarim", icon: Package },
  { href: "/profile#addresses", label: "Yetkazib berish manzillarim", icon: MapPin },
  { href: "/help", label: "Yordam", icon: HelpCircle },
  { href: "/profile#settings", label: "Sozlamalar", icon: Settings },
];

export default function ProfilePage() {
  const { user, isTelegram } = useTelegram();
  const router = useRouter();
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Mehmon";

  return (
    <div className="px-4 pt-4">
      <div className="premium-card flex items-center gap-4 rounded-[28px] p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(139,116,255,0.4)] bg-[rgba(63,42,155,0.22)] text-xl font-semibold text-[#c4b5ff]">
          {name.slice(0, 1)}
        </div>
        <div>
          <h1 className="text-lg font-semibold">{name}</h1>
          <p className="text-sm text-[#9CA3AF]">{user?.username ? `@${user.username}` : "Telegram username yo‘q"}</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">{isTelegram ? `ID: ${user?.id}` : "Brauzer rejimida ochilgan"}</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-white/8">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const isHelp = link.href === "/help";
          const className =
            "flex w-full items-center justify-between border-b border-white/6 bg-[#16102e] px-4 py-4 text-left last:border-b-0";
          const content = (
            <>
              <span className="flex items-center gap-3 text-sm">
                <Icon size={18} className="text-[#8b74ff]" />
                {link.label}
              </span>
              <ChevronRight size={16} className="text-[#9CA3AF]" />
            </>
          );

          if (isHelp) {
            return (
              <button
                key={link.href}
                type="button"
                className={className}
                onClick={() => {
                  haptic("medium");
                  openTelegramLink(SUPPORT.telegramUrl);
                  router.push("/help");
                }}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={link.href} href={link.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
