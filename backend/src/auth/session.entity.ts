import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { User } from '../users/user.entity.js'

@Entity('sessions')
export class Session {
  /** sha256 of the opaque cookie token — the raw token is never stored. */
  @PrimaryColumn('text', { primaryKeyConstraintName: 'sessions_pkey' })
  id!: string

  @Column('integer', { name: 'user_id' })
  userId!: number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'sessions_user_id_users_id_fk' })
  user?: User

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date
}
