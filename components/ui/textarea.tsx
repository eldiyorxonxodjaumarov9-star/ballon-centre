import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-2xl border border-white/10 bg-[#120a28] px-4 py-3 text-base text-white outline-none transition placeholder:text-[#b7b0d0] focus:border-[rgba(139,116,255,0.65)] sm:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
