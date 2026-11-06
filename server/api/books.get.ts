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
    })
    .from(books)
    .leftJoin(copies, eq(copies.bookId, books.id))
    .where(where)
    .groupBy(books.id)
    .orderBy(desc(books.createdAt))
})
