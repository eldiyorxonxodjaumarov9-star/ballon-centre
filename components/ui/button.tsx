import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(180deg,#6b4dff,#3f2a9b)] text-white shadow-[0_10px_24px_rgba(63,42,155,0.38)] hover:brightness-110",
        outline:
          "border border-[rgba(167,139,255,0.28)] bg-white/3 text-white hover:border-[rgba(139,116,255,0.55)] hover:bg-[rgba(63,42,155,0.18)]",
        ghost: "text-white hover:bg-white/6",
        danger: "bg-[#f07167] text-white",
        dark: "bg-[#16102e] text-white border border-[rgba(167,139,255,0.16)] hover:border-[rgba(167,139,255,0.32)]",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-13 px-6 text-[13px] uppercase tracking-[0.14em]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
