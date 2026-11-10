import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { User } from './user.entity.js'

export type EmailTokenPurpose = 'verify_email' | 'reset_password'

/** Single-use links for email verification and password reset. */
@Entity('email_tokens')
@Unique('email_tokens_token_hash_unique', ['tokenHash'])
export class EmailToken {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'email_tokens_pkey' })
  id!: number

  @Column('integer', { name: 'user_id' })
  userId!: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'email_tokens_user_id_users_id_fk' })
  user?: User

  @Column('text')
  purpose!: EmailTokenPurpose

  @Column('text', { name: 'token_hash' })
  tokenHash!: string

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date

  @Column('timestamptz', { name: 'used_at', nullable: true })
  usedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date
}
