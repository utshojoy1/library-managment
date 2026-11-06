import { desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { books, copies } from '../db/schema'

export default defineEventHandler(async (event) => {
  requireUser(event)

  const q = String(getQuery(event).q ?? '').trim()
  const where = q
    ? or(ilike(books.title, `%${q}%`), ilike(books.author, `%${q}%`), ilike(books.isbn, `%${q}%`))
    : undefined

  return db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      isbn: books.isbn,
      category: books.category,
      publishedYear: books.publishedYear,
      total: sql<number>`count(${copies.id})::int`,
      available: sql<number>`(count(${copies.id}) filter (where ${copies.status} = 'available'))::int`,
      // Barcodes of the physical copies, so staff can match a book to the item in hand.
      copies: sql<{ barcode: string; status: string }[]>`coalesce(
        json_agg(
          json_build_object('barcode', ${copies.barcode}, 'status', ${copies.status})
          order by ${copies.barcode}
        ) filter (where ${copies.id} is not null),
        '[]'::json
      )`,
    })
    .from(books)
    .leftJoin(copies, eq(copies.bookId, books.id))
    .where(where)
    .groupBy(books.id)
    .orderBy(desc(books.createdAt))
})
