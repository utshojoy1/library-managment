import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { requireRole } from '@/lib/dal'
import { STAFF, type Member } from '@/lib/types'
import { MembersView } from '@/components/members/members-view'

export const metadata: Metadata = { title: 'Members' }

export default async function MembersPage() {
  await requireRole(STAFF)
  const members = await api<Member[]>('/members')
  return <MembersView members={members} />
}
