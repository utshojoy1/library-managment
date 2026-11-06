import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { books, copies, loans } from '../../db/schema'

export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)

  const body = await readBody(event).catch(() => ({}))
  const barcode = String(body?.barcode ?? '').trim()
  if (!barcode) throw createError({ statusCode: 400, statusMessage: 'Copy barcode is required' })

  return db.transaction(async (tx) => {
    // Lock the copy first — FOR UPDATE is not allowed on the nullable side of a
    // LEFT JOIN, so the loan is resolved in a second, ordinary query.
    const [copy] = await tx
      .select()
      .from(copies)
      .where(eq(copies.barcode, barcode))
      .for('update')

    if (!copy) throw createError({ statusCode: 404, statusMessage: `No copy found with barcode ${barcode}` })

    const [loan] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.copyId, copy.id), eq(loans.status, 'active')))
      .limit(1)

    if (!loan) throw createError({ statusCode: 409, statusMessage: `Copy ${barcode} is not on loan` })

    const [book] = await tx
      .select({ title: books.title })
      .from(books)
      .where(eq(books.id, copy.bookId))

    const returnedAt = new Date()
    await tx.update(loans).set({ returnedAt, status: 'returned' }).where(eq(loans.id, loan.id))
    await tx.update(copies).set({ status: 'available' }).where(eq(copies.id, copy.id))

    const daysLate = Math.max(
      0,
      Math.floor((returnedAt.getTime() - new Date(loan.dueAt).getTime()) / 86_400_000),
    )

    return { bookTitle: book?.title ?? 'Unknown title', daysLate, returnedAt }
  })
})
