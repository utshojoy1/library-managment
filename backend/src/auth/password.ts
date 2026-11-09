import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// Async so hashing doesn't block every other request.
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>

/** Password hashes are `scrypt:<salt-hex>:<hash-hex>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(password, salt, 64)
  return `scrypt:${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const candidate = await scryptAsync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/** Opaque, URL-safe secret for session cookies and email links. */
export function randomToken(): string {
  return randomBytes(32).toString('base64url')
}
