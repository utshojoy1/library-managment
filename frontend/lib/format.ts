export type Role = 'super_admin' | 'admin' | 'member'

export type SessionUser = {
  id: number
  email: string
  name: string
  role: Role
  emailVerified?: boolean
  memberNo?: string
}

export type Loan = {
  id: number
  issuedAt: string
  dueAt: string
  returnedAt: string | null
  status: 'active' | 'returned'
  barcode: string
  bookTitle: string
  author: string
  memberName?: string
  memberNo?: string
}

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
