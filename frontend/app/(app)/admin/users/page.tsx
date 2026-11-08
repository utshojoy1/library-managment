'use client'

import { useState } from 'react'
import { api, errorMessage, useApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatDate, ROLE_LABELS, type Role } from '@/lib/format'

type Account = { id: number; name: string; email: string; role: Role; isActive: boolean; createdAt: string }

export default function UsersPage() {
  const { user: me } = useAuth()
  const { data: users, refresh } = useApi<Account[]>('/admin/users')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<number | null>(null)

  async function update(id: number, patch: Partial<Account>) {
    setSaving(id)
    setError('')
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body: patch })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      await refresh()
      setSaving(null)
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Users &amp; access</h1>
          <p>Promote staff, demote accounts, or disable access. Super admins only.</p>
        </div>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => {
              const locked = u.id === me?.id || saving === u.id
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.id === me?.id && <span className="chip chip-indigo" style={{ marginLeft: 6 }}>you</span>}
                    <div className="mono">{u.email}</div>
                  </td>
                  <td>
                    <select
                      className="input input-sm"
                      value={u.role}
                      disabled={locked}
                      aria-label={`Role for ${u.name}`}
                      onChange={(e) => update(u.id, { role: e.target.value as Role })}
                    >
                      {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                        <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`chip ${u.isActive ? 'chip-green' : 'chip-gray'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm" disabled={locked} onClick={() => update(u.id, { isActive: !u.isActive })}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <p className="hint">
        Admins can manage the catalog, members and circulation. Members can browse the catalog and see their own
        loans. You cannot change your own role or disable your own account.
      </p>
    </div>
  )
}
