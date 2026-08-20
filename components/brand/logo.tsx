import { cn } from "@/lib/utils";

const SIZE = {
  sm: 40,
  md: 72,
  lg: 128,
} as const;

export function BrandLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const px = SIZE[size];

  return (
    <span className={cn("inline-flex overflow-hidden rounded-full bg-black", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="BALON SHOPBOT"
        width={px}
        height={px}
        className="object-cover"
        style={{ width: px, height: px }}
      />
    </span>
  );
}
