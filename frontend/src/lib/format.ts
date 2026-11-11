import type { Activity, Role } from './types'

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

/** Activity-log labels. Lives here (not activity-list) so client components can import it without server-only code. */
export const VERB: Record<Activity['type'], string> = {
  book_added: 'Book added',
  book_updated: 'Book edited',
  book_deleted: 'Book deleted',
  member_joined: 'Member joined',
  member_updated: 'Member edited',
  member_enabled: 'Member enabled',
  member_disabled: 'Member disabled',
  member_deleted: 'Member deleted',
  issued: 'Issued',
  returned: 'Returned',
}
