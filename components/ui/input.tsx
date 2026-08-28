import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-white/10 bg-[#120a28] px-4 text-base text-white outline-none transition placeholder:text-[#b7b0d0] focus:border-[rgba(139,116,255,0.65)] focus:shadow-[0_0_0_3px_rgba(63,42,155,0.28)] sm:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
