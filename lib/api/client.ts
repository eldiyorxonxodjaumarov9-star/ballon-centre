import { ApiError } from "@/lib/api/http";
import type { ProductFilters } from "@/types";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) headers.set("x-telegram-init-data", initData);
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError("Internet aloqasi yo‘q. Qayta urinib ko‘ring.");
  }

  let payload: unknown = {};
  try {
    payload = await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    if (init?.signal?.aborted) {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      throw abortError;
    }
    if (!response.ok) throw new ApiError("Tarmoq xatosi yuz berdi", response.status);
    throw new ApiError("Ma'lumot o‘qilmadi. Qayta urinib ko‘ring.");
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error?: unknown }).error ?? "Tarmoq xatosi yuz berdi")
        : "Tarmoq xatosi yuz berdi";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export function asList<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export function filtersToQuery(filters: ProductFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
