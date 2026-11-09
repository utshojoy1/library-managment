'use client'

import { useState, useTransition } from 'react'
import { formatDate, ROLE_LABELS } from '@/lib/format'
import type { Account, Role } from '@/lib/types'
import { updateUser } from '@/actions/users'

export function UsersTable({ users, meId }: { users: Account[]; meId: number }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  function update(id: number, patch: { role?: Role; isActive?: boolean }) {
    setSaving(id)
    setError('')
    startTransition(async () => {
      const result = await updateUser(id, patch)
      setError(result.error ?? '')
      setSaving(null)
    })
  }

  return (
    <>
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
            {users.map((u) => {
              const locked = u.id === meId || saving === u.id
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.id === meId && <span className="chip chip-indigo" style={{ marginLeft: 6 }}>you</span>}
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
    </>
  )
}
