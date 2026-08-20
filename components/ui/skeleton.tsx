import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/6", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="premium-card overflow-hidden rounded-3xl p-3">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="mt-3 h-3 w-16" />
      <Skeleton className="mt-2 h-4 w-28" />
      <Skeleton className="mt-2 h-3 w-20" />
      <Skeleton className="mt-4 h-5 w-24" />
      <Skeleton className="mt-3 h-10 w-full rounded-full" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="page-pad px-4 pt-4">
      <Skeleton className="aspect-[4/3] w-full rounded-[28px]" />
      <Skeleton className="mt-5 h-4 w-24" />
      <Skeleton className="mt-2 h-8 w-48" />
      <Skeleton className="mt-4 h-16 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-24 w-full rounded-3xl" />
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="premium-card rounded-3xl p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-5 w-40" />
      <Skeleton className="mt-2 h-4 w-32" />
    </div>
  );
}
