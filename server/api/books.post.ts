import { db } from '../db/client'
import { books, copies } from '../db/schema'

export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)

  const body = await readBody(event).catch(() => ({}))

  const title = String(body?.title ?? '').trim()
  const author = String(body?.author ?? '').trim()
  const isbn = String(body?.isbn ?? '').trim() || null
  const category = String(body?.category ?? '').trim() || null
  const publishedYear = Number(body?.publishedYear) || null
  const copyCount = Math.min(Math.max(Number(body?.copies) || 1, 1), 50)

  if (!title) throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  if (!author) throw createError({ statusCode: 400, statusMessage: 'Author is required' })

  const [book] = await db
    .insert(books)
    .values({ title, author, isbn, category, publishedYear })
    .returning()

  const barcodes = Array.from(
    { length: copyCount },
    (_, i) => `B${String(book!.id).padStart(4, '0')}-${i + 1}`,
  )

  await db.insert(copies).values(barcodes.map((barcode) => ({ bookId: book!.id, barcode })))

  return { ...book, copies: copyCount }
})
