type Bucket = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets = globalThis.__rateLimitBuckets ?? new Map<string, Bucket>();

if (!globalThis.__rateLimitBuckets) {
  globalThis.__rateLimitBuckets = buckets;
}

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export function enforceRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    const retryAfterMs = Math.max(0, bucket.resetAt - now);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    throw new Error(`RATE_LIMIT:${retryAfterSeconds}`);
  }

  bucket.count += 1;
}
