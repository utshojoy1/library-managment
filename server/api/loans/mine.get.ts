import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { books, copies, loans, members } from '../../db/schema'

/** Loans belonging to the signed-in member account. */
export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1)

  if (!member) return []

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
    })
    .from(loans)
    .innerJoin(copies, eq(loans.copyId, copies.id))
    .innerJoin(books, eq(copies.bookId, books.id))
    .where(eq(loans.memberId, member.id))
    .orderBy(desc(loans.issuedAt))
    .limit(50)
})
