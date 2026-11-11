// Shapes returned by the NestJS API. Shared by server and client components.

export type Role = 'super_admin' | 'admin' | 'member'
export const STAFF: Role[] = ['admin', 'super_admin']

export type SessionUser = {
  id: number
  email: string
  name: string
  role: Role
  emailVerified: boolean
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

export type Book = {
  id: number
  title: string
  author: string
  isbn: string | null
  category: string | null
  publishedYear: number | null
  total: number
  available: number
  copies: { barcode: string; status: string }[]
}

export type Member = {
  id: number
  memberNo: string
  name: string
  email: string | null
  phone: string | null
  joinedAt: string
  isActive: boolean
  activeLoans: number
}

export type Account = { id: number; name: string; email: string; role: Role; isActive: boolean; createdAt: string }

export type Stats = {
  books: number
  copies: number
  members: number
  activeLoans: number
  overdue: number
  dueSoon: number
  categories: { name: string; count: number }[]
}

export type Mail = { id: number; to: string; subject: string; text: string; status: string; createdAt: string }

/** What a form's Server Action hands back to `useActionState`. */
export type FormState = { error?: string; ok?: string }

export type Activity = {
  type:
    | 'book_added'
    | 'book_updated'
    | 'book_deleted'
    | 'member_joined'
    | 'member_updated'
    | 'member_enabled'
    | 'member_disabled'
    | 'member_deleted'
    | 'issued'
    | 'returned'
  at: string
  subject: string
  detail: string | null
  /** Who did it; null for entries backfilled from before logging existed. */
  actor: string | null
  /** Null once the book / member has been deleted. */
  bookId: number | null
  memberId: number | null
}
