import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common'
import { desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from './db.js'
import { books, copies } from './schema.js'
import { Roles, STAFF, str } from './common.js'

@Controller('books')
export class BooksController {
  @Get()
  list(@Query('q') query?: string) {
    const q = str(query)
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
  }

  @Post()
  @Roles(...STAFF)
  async create(@Body() body: Record<string, unknown> | undefined) {
    const title = str(body?.title)
    const author = str(body?.author)
    if (!title) throw new BadRequestException('Title is required')
    if (!author) throw new BadRequestException('Author is required')

    const copyCount = Math.min(Math.max(Number(body?.copies) || 1, 1), 50)

    const book = await db.transaction(async (tx) => {
      const [book] = await tx
        .insert(books)
        .values({
          title,
          author,
          isbn: str(body?.isbn) || null,
          category: str(body?.category) || null,
          publishedYear: Number(body?.publishedYear) || null,
        })
        .returning()

      await tx.insert(copies).values(
        Array.from({ length: copyCount }, (_, i) => ({
          bookId: book!.id,
          barcode: `B${String(book!.id).padStart(4, '0')}-${i + 1}`,
        })),
      )
      return book!
    })

    return { ...book, copies: copyCount }
  }
}
