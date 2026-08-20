import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[rgba(139,116,255,0.35)] bg-[rgba(63,42,155,0.22)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c4b5ff]",
        className,
      )}
    >
      {children}
    </span>
  );
}
