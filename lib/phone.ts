/** Normalize Uzbekistan phone to +998XXXXXXXXX or null if invalid. */
export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national = "";

  if (digits.length === 9) {
    national = digits;
  } else if (digits.length === 12 && digits.startsWith("998")) {
    national = digits.slice(3);
  } else {
    return null;
  }

  if (!/^\d{9}$/.test(national)) return null;
  return `+998${national}`;
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizeUzPhone(phone);
  if (!normalized) return phone;
  const rest = normalized.slice(4);
  return `+998 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 7)} ${rest.slice(7)}`;
}
