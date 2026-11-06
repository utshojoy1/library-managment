import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { books, copies, loans, members } from '../db/schema'

export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)

  const query = getQuery(event)
  const status = query.status ? String(query.status) : undefined
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200)

  return db
    .select({
      id: loans.id,
      issuedAt: loans.issuedAt,
      dueAt: loans.dueAt,
      returnedAt: loans.returnedAt,
      status: loans.status,
      barcode: copies.barcode,
      bookTitle: books.title,
      author: books.author,
      memberName: members.name,
      memberNo: members.memberNo,
    })
    .from(loans)
    .innerJoin(copies, eq(loans.copyId, copies.id))
    .innerJoin(books, eq(copies.bookId, books.id))
    .innerJoin(members, eq(loans.memberId, members.id))
    .where(status ? eq(loans.status, status) : undefined)
    .orderBy(desc(loans.issuedAt))
    .limit(limit)
})
