import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Book } from './book.entity.js'

export type CopyStatus = 'available' | 'on_loan'

/** One physical, barcoded copy of a book. */
@Entity('copies')
@Unique('copies_barcode_unique', ['barcode'])
export class Copy {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'copies_pkey' })
  id!: number

  @Column('integer', { name: 'book_id' })
  bookId!: number

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id', foreignKeyConstraintName: 'copies_book_id_books_id_fk' })
  book?: Book

  @Column('text')
  barcode!: string

  @Column('text', { default: 'available' })
  status!: CopyStatus
}
