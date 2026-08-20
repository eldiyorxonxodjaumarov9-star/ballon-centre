"use client";

import { Input } from "@/components/ui/input";
import { digitsOnly, groupThousands } from "@/lib/utils";

export type MoneyCurrency = "UZS" | "USD";

type MoneyInputProps = {
  value: string;
  onChange: (value: string) => void;
  currency?: MoneyCurrency;
  placeholder?: string;
  required?: boolean;
};

function sanitizeMoney(raw: string, currency: MoneyCurrency): string {
  if (currency === "USD") {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const [whole = "", ...rest] = cleaned.split(".");
    const fraction = rest.join("").slice(0, 2);
    return rest.length ? `${whole}.${fraction}` : whole;
  }
  return digitsOnly(raw);
}

function displayMoney(value: string, currency: MoneyCurrency): string {
  if (!value) return "";
  if (currency === "USD") {
    const [whole = "", fraction] = value.split(".");
    const grouped = groupThousands(whole || "0").replace(/^0+(?=\d)/, "") || (whole ? "0" : "");
    if (value.includes(".")) return `${grouped || "0"}.${fraction ?? ""}`;
    return groupThousands(whole);
  }
  return groupThousands(value);
}

export function MoneyInput({
  value,
  onChange,
  currency = "UZS",
  placeholder,
  required,
}: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={currency === "USD" ? "pr-10" : "pr-14"}
        placeholder={placeholder}
        required={required}
        value={displayMoney(value, currency)}
        onChange={(e) => onChange(sanitizeMoney(e.target.value, currency))}
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[#9CA3AF]">
        {currency === "USD" ? "$" : "so'm"}
      </span>
    </div>
  );
}
