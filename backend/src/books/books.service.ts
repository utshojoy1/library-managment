import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { isForeignKeyViolation } from '../common/db-errors.js'
import { Book } from '../entities/book.entity.js'
import { Copy } from '../entities/copy.entity.js'
import type { CreateBookDto } from './dto/create-book.dto.js'
import type { UpdateBookDto } from './dto/update-book.dto.js'

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly books: Repository<Book>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findAll(q?: string) {
    const query = this.bookRows().orderBy('b.createdAt', 'DESC')

    // `?q=a&q=b` arrives as an array; treat anything but a string as no search.
    const search = typeof q === 'string' ? q.trim() : ''
    if (search) {
      query.where('b.title ILIKE :s OR b.author ILIKE :s OR b.isbn ILIKE :s', { s: `%${search}%` })
    }
    return query.getRawMany()
  }

  async findOne(id: number) {
    const book = await this.bookRows().where('b.id = :id', { id }).getRawOne()
    if (!book) throw new NotFoundException('Book not found')
    return book
  }

  async update(id: number, dto: UpdateBookDto) {
    const result = await this.books.update(id, {
      title: dto.title,
      author: dto.author,
      isbn: dto.isbn || null,
      category: dto.category || null,
      publishedYear: dto.publishedYear ?? null,
    })
    if (!result.affected) throw new NotFoundException('Book not found')
    return this.findOne(id)
  }

  async remove(id: number) {
    try {
      // Copies cascade; loans don't, so the database itself refuses a book with any loan history.
      const result = await this.books.delete(id)
      if (!result.affected) throw new NotFoundException('Book not found')
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException('This book has borrow history, so it can’t be deleted — its history must be kept')
      }
      throw error
    }
  }

  /** Books with copy counts and barcodes; one row per book. */
  private bookRows() {
    return this.books
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
