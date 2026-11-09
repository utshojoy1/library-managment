import type { Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  member: 'Member',
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysUntil(value: string | Date) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000)
}

/** Same rule as the API: codes are trimmed and uppercase. */
export function normalizeCode(value: string) {
  return value.trim().toUpperCase()
}
