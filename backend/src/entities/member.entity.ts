import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { User } from './user.entity.js'

@Entity('members')
@Unique('members_member_no_unique', ['memberNo'])
@Unique('members_user_id_unique', ['userId'])
export class Member {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'members_pkey' })
  id!: number

  /** Set for self-registered accounts: their library card. */
  @Column('integer', { name: 'user_id', nullable: true })
  userId!: number | null

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'members_user_id_users_id_fk' })
  user?: User | null

  @Column('text', { name: 'member_no' })
  memberNo!: string

  @Column('text')
  name!: string

  @Column('text', { nullable: true })
  email!: string | null

  @Column('text', { nullable: true })
  phone!: string | null

  /** `YYYY-MM-DD`; a date column comes back as a string. */
  @Column('date', { name: 'joined_at', default: () => 'CURRENT_DATE' })
  joinedAt!: string

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean
}
