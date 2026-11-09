import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'
import type { Role } from '../common/roles.js'

@Entity('users')
@Unique('users_email_unique', ['email'])
export class User {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'users_pkey' })
  id!: number

  @Column('text')
  email!: string

  @Column('text')
  name!: string

  @Column('text', { name: 'password_hash' })
  passwordHash!: string

  @Column('text', { default: 'member' })
  role!: Role

  @Column('boolean', { name: 'is_active', default: true })
  isActive!: boolean

  @Column('timestamptz', { name: 'email_verified_at', nullable: true })
  emailVerifiedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date
}
