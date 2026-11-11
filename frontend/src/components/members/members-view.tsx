'use client'

import { useCallback, useState } from 'react'
import { formatDate } from '@/lib/format'
import type { Member } from '@/lib/types'
import { AddMemberForm } from './add-member-form'
import { MemberStatusButton } from './member-status-button'
import { DeleteMemberButton } from './delete-member-button'
import { SetPasswordButton } from './set-password-button'

/** Client for the add/edit form toggle; the list comes from server data. Editing and disabling are super-admin only. */
export function MembersView({ members, canManage }: { members: Member[]; canManage: boolean }) {
  // Which form is open: none, a new member, or the member being edited.
  const [editing, setEditing] = useState<Member | 'new' | null>(null)
  const [error, setError] = useState('')
  const close = useCallback(() => setEditing(null), [])

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Members</h1>
          <p>{members.length} registered borrowers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(editing ? null : 'new')}>
          {editing ? 'Cancel' : 'Add member'}
        </button>
      </header>

      {/* Keyed, so it remounts with fresh fields for each member (or a new one). */}
      {editing && (
        <AddMemberForm
          key={editing === 'new' ? 'new' : editing.id}
          member={editing === 'new' ? undefined : editing}
          onDone={close}
        />
      )}

      {error && (
        <div className="banner banner-error" role="alert">
          {error}{' '}
          <button type="button" className="link-sm" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <section className="card">
        {!members.length ? (
          <div className="empty">No members yet — add the first one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Number</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Borrowed</th>
                <th>Status</th>
                {canManage && <th aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className={member.isActive ? undefined : 'row-muted'}>
                  <td><strong>{member.name}</strong></td>
                  <td className="mono">{member.memberNo}</td>
                  <td>
                    {member.email || '—'}
                    <div className="mono">{member.phone}</div>
                  </td>
                  <td>{formatDate(member.joinedAt)}</td>
                  <td>
                    <span className={`chip ${member.activeLoans >= 5 ? 'chip-red' : 'chip-gray'}`}>
                      {member.activeLoans} / 5
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${member.isActive ? 'chip-green' : 'chip-red'}`}>
                      {member.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            setEditing(member)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          Edit
                        </button>
                        {member.hasAccount && <SetPasswordButton member={member} />}
                        <MemberStatusButton member={member} onError={setError} />
                        <DeleteMemberButton member={member} onError={setError} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
