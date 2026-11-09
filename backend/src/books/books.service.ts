import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Book } from './book.entity.js'
import { Copy } from './copy.entity.js'
import type { CreateBookDto } from './dto/create-book.dto.js'

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly books: Repository<Book>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findAll(q?: string) {
    const query = this.books
      .createQueryBuilder('b')
      .leftJoin(Copy, 'c', 'c.bookId = b.id')
      .select('b.id', 'id')
      .addSelect('b.title', 'title')
      .addSelect('b.author', 'author')
      .addSelect('b.isbn', 'isbn')
      .addSelect('b.category', 'category')
      .addSelect('b.publishedYear', 'publishedYear')
      .addSelect('count(c.id)::int', 'total')
      .addSelect(`(count(c.id) filter (where c.status = 'available'))::int`, 'available')
      // Barcodes of the physical copies, so staff can match a book to the item in hand.
      .addSelect(
        `coalesce(
          json_agg(json_build_object('barcode', c.barcode, 'status', c.status) order by c.barcode)
            filter (where c.id is not null),
          '[]'::json
        )`,
        'copies',
      )
      .groupBy('b.id')
      .orderBy('b.createdAt', 'DESC')

    // `?q=a&q=b` arrives as an array; treat anything but a string as no search.
    const search = typeof q === 'string' ? q.trim() : ''
    if (search) {
      query.where('b.title ILIKE :s OR b.author ILIKE :s OR b.isbn ILIKE :s', { s: `%${search}%` })
    }
    return query.getRawMany()
  }

  async create(dto: CreateBookDto) {
    const copyCount = dto.copies ?? 1

    const book = await this.dataSource.transaction(async (manager) => {
      const book = await manager.save(
        manager.create(Book, {
          title: dto.title,
          author: dto.author,
          isbn: dto.isbn || null,
          category: dto.category || null,
          publishedYear: dto.publishedYear ?? null,
        }),
      )

      await manager.insert(
        Copy,
        Array.from({ length: copyCount }, (_, i) => ({
          bookId: book.id,
          barcode: `B${String(book.id).padStart(4, '0')}-${i + 1}`,
        })),
      )
      return book
    })

    return { ...book, copies: copyCount }
  }
}
