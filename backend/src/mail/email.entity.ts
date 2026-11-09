import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type EmailStatus = 'queued' | 'sent' | 'failed'

/** Outbox: every message is stored, whether or not SMTP delivered it. */
@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'emails_pkey' })
  id!: number

  @Column('text')
  to!: string

  @Column('text')
  subject!: string

  @Column('text')
  text!: string

  @Column('text', { default: 'queued' })
  status!: EmailStatus

  @Column('text', { nullable: true })
  error!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date

  @Column('timestamptz', { name: 'sent_at', nullable: true })
  sentAt!: Date | null
}
