"use client";

import { useId } from "react";
import type { Season } from "@/types";

const SEASON_TONE: Record<Season, string> = {
  SUMMER: "#8b74ff",
  WINTER: "#8eb6d8",
  ALL_SEASON: "#b7c4b0",
};

export function TireVisual({
  brand,
  model,
  size,
  season,
  className = "",
  showCaption = false,
  variant = "tire",
}: {
  brand: string;
  model: string;
  size: string;
  season: Season;
  className?: string;
  showCaption?: boolean;
  variant?: "tire" | "battery" | "rim";
}) {
  const rawId = useId().replace(/:/g, "");
  const rimId = `rim-${rawId}`;
  const chromeId = `chrome-${rawId}`;
  const tone = SEASON_TONE[season];

  return (
    <div className={`relative overflow-hidden bg-[#120a28] ${className}`}>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${tone}22, transparent 42%), radial-gradient(circle at 80% 80%, #ffffff08, transparent 40%)`,
        }}
      />
      {variant === "battery" ? (
        <svg viewBox="0 0 200 200" className="relative z-10 h-full w-full p-[16%]">
          <rect x="58" y="36" width="28" height="14" rx="3" fill="#8b74ff" />
          <rect x="114" y="36" width="28" height="14" rx="3" fill="#8b74ff" />
          <rect x="42" y="48" width="116" height="118" rx="16" fill="#161616" stroke="#8b74ff" strokeWidth="3" />
          <rect x="58" y="70" width="84" height="12" rx="3" fill="#2a2a2a" />
          <rect x="58" y="92" width="84" height="12" rx="3" fill="#2a2a2a" />
          <rect x="58" y="114" width="54" height="12" rx="3" fill="#8b74ff" />
        </svg>
      ) : (
        <svg viewBox="0 0 200 200" className="relative z-10 h-full w-full p-[8%]">
          <defs>
            <radialGradient id={rimId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3a3a3a" />
              <stop offset="70%" stopColor="#161616" />
              <stop offset="100%" stopColor="#090909" />
            </radialGradient>
            <linearGradient id={chromeId} x1="0" x2="1">
              <stop offset="0%" stopColor="#9a9a9a" />
              <stop offset="50%" stopColor="#f2f2f2" />
              <stop offset="100%" stopColor="#7d7d7d" />
            </linearGradient>
          </defs>
          {variant === "rim" ? (
            <>
              <circle cx="100" cy="100" r="78" fill="none" stroke="#333" strokeWidth="8" />
              <circle cx="100" cy="100" r="62" fill={`url(#${rimId})`} stroke={`url(#${chromeId})`} strokeWidth="3" />
            </>
          ) : (
            <>
              <circle cx="100" cy="100" r="78" fill="#111" stroke="#222" strokeWidth="16" />
              <circle cx="100" cy="100" r="78" fill="none" stroke="#1c1c1c" strokeWidth="10" strokeDasharray="3 7" />
              <circle cx="100" cy="100" r={58} fill={`url(#${rimId})`} stroke={`url(#${chromeId})`} strokeWidth="2" />
            </>
          )}
          {Array.from({ length: 7 }).map((_, i) => (
            <rect
              key={i}
              x="97"
              y="48"
              width="6"
              height="28"
              rx="2"
              fill="#cfcfcf"
              transform={`rotate(${i * (360 / 7)} 100 100)`}
            />
          ))}
          <circle cx="100" cy="100" r="14" fill="#0b0b0b" stroke={tone} strokeWidth="2" />
        </svg>
      )}
      {showCaption ? (
        <div className="absolute inset-x-2 bottom-2 z-20 rounded-xl bg-black/55 px-2 py-1.5 backdrop-blur-sm">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c4b5ff]">{brand}</p>
          <p className="truncate text-xs text-white/85">{model}</p>
          <p className="truncate text-[11px] text-[#9CA3AF]">{size}</p>
        </div>
      ) : null}
    </div>
  );
}
