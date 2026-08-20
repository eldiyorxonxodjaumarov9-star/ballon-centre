"use client";

import { Minus, Plus } from "lucide-react";
import { haptic } from "@/lib/telegram/webapp";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  min = 0,
  max = 99,
  onChange,
  size = "md",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
}) {
  const compact = size === "sm";
  const btn = compact ? "h-8 w-8" : "h-10 w-10";
  const canMinus = value > min;
  const canPlus = value < max;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center rounded-full border border-[rgba(139,116,255,0.35)] bg-[rgba(63,42,155,0.22)]",
        compact ? "gap-1 p-0.5" : "gap-1.5 p-1",
      )}
    >
      <button
        type="button"
        aria-label="Kamaytirish"
        disabled={!canMinus}
        onClick={() => {
          haptic("light");
          onChange(value - 1);
        }}
        className={cn(
          "flex items-center justify-center rounded-full bg-[#0a0618] text-white disabled:opacity-35",
          btn,
        )}
      >
        <Minus size={compact ? 14 : 16} />
      </button>
      <span className={cn("min-w-6 text-center font-semibold tabular-nums", compact ? "text-sm" : "text-base")}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Ko‘paytirish"
        disabled={!canPlus}
        onClick={() => {
          haptic("light");
          onChange(value + 1);
        }}
        className={cn(
          "flex items-center justify-center rounded-full bg-[#3f2a9b] text-white disabled:opacity-35",
          btn,
        )}
      >
        <Plus size={compact ? 14 : 16} />
      </button>
    </div>
  );
}
