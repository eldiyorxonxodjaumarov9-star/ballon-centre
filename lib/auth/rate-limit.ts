const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 40, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function clientKey(ip: string | null, route: string): string {
  return `${ip ?? "unknown"}:${route}`;
}
