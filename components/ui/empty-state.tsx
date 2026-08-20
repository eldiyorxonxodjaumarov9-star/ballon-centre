import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
      {description ? <p className="mt-2 max-w-xs text-sm text-[#9CA3AF]">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={cn("mx-4 rounded-3xl border border-[#f07167]/30 bg-[#f07167]/8 p-5 text-center")}>
      <p className="text-sm text-[#f07167]">{message}</p>
      {onRetry ? (
        <button className="mt-3 text-xs uppercase tracking-[0.16em] text-white" onClick={onRetry}>
          Qayta urinish
        </button>
      ) : null}
    </div>
  );
}
