import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Copy } from '../books/copy.entity.js'
import { Member } from '../members/member.entity.js'

export type LoanStatus = 'active' | 'returned'

@Entity('loans')
// A physical copy can only ever have one active loan.
@Index('loans_one_active_per_copy', ['copyId'], { unique: true, where: `status = 'active'` })
@Index('loans_active_member', ['memberId'], { where: `status = 'active'` })
export class Loan {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'loans_pkey' })
  id!: number

  @Column('integer', { name: 'copy_id' })
  copyId!: number

  @ManyToOne(() => Copy)
  @JoinColumn({ name: 'copy_id', foreignKeyConstraintName: 'loans_copy_id_copies_id_fk' })
  copy?: Copy

  @Column('integer', { name: 'member_id' })
  memberId!: number

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id', foreignKeyConstraintName: 'loans_member_id_members_id_fk' })
  member?: Member

  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz', default: () => 'now()' })
  issuedAt!: Date

  @Column('timestamptz', { name: 'due_at' })
  dueAt!: Date

  @Column('timestamptz', { name: 'returned_at', nullable: true })
  returnedAt!: Date | null

  @Column('text', { default: 'active' })
  status!: LoanStatus
}
