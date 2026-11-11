import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Book } from './book.entity.js'
import { Member } from './member.entity.js'
import { User } from './user.entity.js'

export type ActivityAction =
  | 'book_added'
  | 'book_updated'
  | 'book_deleted'
  | 'member_joined'
  | 'member_updated'
  | 'member_enabled'
  | 'member_disabled'
  | 'member_deleted'
  | 'issued'
  | 'returned'

/**
 * Append-only audit trail. Names are snapshotted into `subject`/`detail`/`actorName`,
 * so an entry still reads correctly after its book, member or user is deleted;
 * the ids go null on delete, which is how the UI knows not to link them.
 */
@Entity('activity_logs')
@Index('activity_logs_at', ['at'])
export class ActivityLog {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'activity_logs_pkey' })
  id!: number

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  at!: Date

  @Column('text')
  action!: ActivityAction

  @Column('integer', { name: 'actor_id', nullable: true })
  actorId!: number | null

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id', foreignKeyConstraintName: 'activity_logs_actor_id_users_id_fk' })
  actor?: User | null

  @Column('text', { name: 'actor_name', nullable: true })
  actorName!: string | null

  @Column('integer', { name: 'book_id', nullable: true })
  bookId!: number | null

  @ManyToOne(() => Book, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'book_id', foreignKeyConstraintName: 'activity_logs_book_id_books_id_fk' })
  book?: Book | null

  @Column('integer', { name: 'member_id', nullable: true })
  memberId!: number | null

  @ManyToOne(() => Member, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'member_id', foreignKeyConstraintName: 'activity_logs_member_id_members_id_fk' })
  member?: Member | null

  /** What it happened to: a book title or member name. */
  @Column('text')
  subject!: string

  /** Second line of context: author, member number, borrower, changes… */
  @Column('text', { nullable: true })
  detail!: string | null
}
