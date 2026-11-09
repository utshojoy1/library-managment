import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { requireRole } from '@/lib/dal'
import type { Account } from '@/lib/types'
import { UsersTable } from '@/components/users/users-table'

export const metadata: Metadata = { title: 'Users & access' }

export default async function UsersPage() {
  const me = await requireRole(['super_admin'])
  const users = await api<Account[]>('/admin/users')

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Users &amp; access</h1>
          <p>Promote staff, demote accounts, or disable access. Super admins only.</p>
        </div>
      </header>

      <UsersTable users={users} meId={me.id} />

      <p className="hint">
        Admins can manage the catalog, members and circulation. Members can browse the catalog and see their own
        loans. You cannot change your own role or disable your own account.
      </p>
    </div>
  )
}
