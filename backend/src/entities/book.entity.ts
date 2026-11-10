import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'books_pkey' })
  id!: number

  @Column('text')
  title!: string

  @Column('text')
  author!: string

  @Column('text', { nullable: true })
  isbn!: string | null

  @Column('text', { nullable: true })
  category!: string | null

  @Column('integer', { name: 'published_year', nullable: true })
  publishedYear!: number | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date
}
