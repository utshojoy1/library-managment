import { HttpException, HttpStatus } from '@nestjs/common'
import type { Request } from 'express'

const buckets = new Map<string, number[]>()

/**
 * shortcut: in-memory fixed window, correct only for one API process; move to
 * Redis or a Postgres table before running more than one instance.
 */
export function rateLimit(key: string, limit: number, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((at) => now - at < windowMs)

  if (hits.length >= limit) {
    throw new HttpException('Too many attempts. Please try again in a few minutes.', HttpStatus.TOO_MANY_REQUESTS)
  }

  hits.push(now)
  buckets.set(key, hits)

  if (buckets.size > 5000) {
    for (const [bucketKey, timestamps] of buckets) {
      if (!timestamps.some((at) => now - at < windowMs)) buckets.delete(bucketKey)
    }
  }
}

/**
 * Per-IP limit, applied only when TRUST_PROXY names a front proxy (nginx, Caddy…) that sets
 * X-Forwarded-For. Behind the Next.js rewrite alone, every request arrives from localhost and
 * the header is whatever the client sent: an IP bucket would be shared by all users, or spoofed.
 */
export function rateLimitByIp(req: Request, key: string, limit: number, windowMs?: number) {
  if (process.env.TRUST_PROXY && req.ip) rateLimit(`${key}:${req.ip}`, limit, windowMs)
}
