const buckets = new Map<string, number[]>();

export function tooMany(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const prev = (buckets.get(key) || []).filter((time) => now - time < windowMs);
  if (prev.length >= limit) {
    buckets.set(key, prev);
    return true;
  }
  prev.push(now);
  buckets.set(key, prev.slice(-limit));
  return false;
}

export function clientKey(request: Request) {
  return (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim() || "local";
}

export function noticeAllowed(key: string) {
  return !tooMany(`notice:${key}`, 20, 60 * 60 * 1000);
}
