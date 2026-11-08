import {
  createParamDecorator,
  HttpException,
  HttpStatus,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common'
import type { Request } from 'express'

export type Role = 'super_admin' | 'admin' | 'member'
export const ROLES: Role[] = ['super_admin', 'admin', 'member']
export const STAFF: Role[] = ['admin', 'super_admin']

export type SessionUser = {
  id: number
  email: string
  name: string
  role: Role
  emailVerified: boolean
}

export type AuthedRequest = Request & { user?: SessionUser }

/** Every route needs a signed-in user unless marked @Public(). */
export const IS_PUBLIC = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC, true)

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user!,
)

/** Request bodies are untrusted: coerce every field to a trimmed string. */
export function str(value: unknown): string {
  return String(value ?? '').trim()
}

/**
 * Barcodes and member numbers are stored uppercase (`B0002-1`, `M001`), so a
 * scanned or hand-typed lowercase value still finds the right record.
 */
export function normalizeCode(value: unknown): string {
  return str(value).toUpperCase()
}

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

/** Postgres unique-violation, whether drizzle wraps the driver error or not. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return (e?.code ?? e?.cause?.code) === '23505'
}
