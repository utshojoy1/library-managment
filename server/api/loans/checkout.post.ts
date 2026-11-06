import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { books, copies, loans, members } from '../../db/schema'

const LOAN_DAYS = 14
const MAX_ACTIVE_LOANS = 5

export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)

  const body = await readBody(event).catch(() => ({}))
  const barcode = normalizeCode(body?.barcode)
  const memberNo = normalizeCode(body?.memberNo)

  if (!barcode) throw createError({ statusCode: 400, statusMessage: 'Copy barcode is required' })
  if (!memberNo) throw createError({ statusCode: 400, statusMessage: 'Member number is required' })

  return db.transaction(async (tx) => {
    const [member] = await tx.select().from(members).where(eq(members.memberNo, memberNo)).limit(1)
    if (!member) throw createError({ statusCode: 404, statusMessage: `No member found with number ${memberNo}` })
    if (!member.isActive) throw createError({ statusCode: 409, statusMessage: 'This membership is inactive' })

    // Lock the copy so two desks cannot issue the same physical book.
    const [row] = await tx
      .select({ copy: copies, bookTitle: books.title })
      .from(copies)
      .innerJoin(books, eq(copies.bookId, books.id))
      .where(eq(copies.barcode, barcode))
      .for('update')
    if (!row) throw createError({ statusCode: 404, statusMessage: `No copy found with barcode ${barcode}` })
    if (row.copy.status !== 'available') {
      throw createError({ statusCode: 409, statusMessage: `Copy ${barcode} is currently ${row.copy.status.replace('_', ' ')}` })
    }

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(loans)
      .where(and(eq(loans.memberId, member.id), eq(loans.status, 'active')))
    if (count >= MAX_ACTIVE_LOANS) {
      throw createError({ statusCode: 409, statusMessage: `${member.name} already has ${count} books on loan (limit ${MAX_ACTIVE_LOANS})` })
    }

    const dueAt = new Date(Date.now() + LOAN_DAYS * 24 * 60 * 60 * 1000)
    const [loan] = await tx
      .insert(loans)
      .values({ copyId: row.copy.id, memberId: member.id, dueAt })
      .returning()

    await tx.update(copies).set({ status: 'on_loan' }).where(eq(copies.id, row.copy.id))

    return {
      loanId: loan!.id,
      bookTitle: row.bookTitle,
      memberName: member.name,
      dueAt: loan!.dueAt,
    }
  })
})
