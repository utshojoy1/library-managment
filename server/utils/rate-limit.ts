const buckets = new Map<string, number[]>()

/**
 * Fixed-window limiter held in memory — adequate for a single Node process.
 * Swap for Redis if this ever runs on more than one instance.
 */
export function rateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((at) => now - at < windowMs)

  if (hits.length >= limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many attempts. Please try again in a few minutes.',
    })
  }

  hits.push(now)
  buckets.set(key, hits)

  if (buckets.size > 5000) {
    for (const [bucketKey, timestamps] of buckets) {
      if (!timestamps.some((at) => now - at < windowMs)) buckets.delete(bucketKey)
    }
  }
}
