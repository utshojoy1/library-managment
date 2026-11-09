'use client'

import { useCallback, useState } from 'react'
import { formatDate } from '@/lib/format'
import type { Member } from '@/lib/types'
import { AddMemberForm } from './add-member-form'

/** Client only for the add-member toggle; the list comes from server data. */
export function MembersView({ members }: { members: Member[] }) {
  const [showForm, setShowForm] = useState(false)
  const close = useCallback(() => setShowForm(false), [])

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Members</h1>
          <p>{members.length} registered borrowers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add member'}
        </button>
      </header>

      {/* Remounted each time it opens, so the form starts empty. */}
      {showForm && <AddMemberForm onDone={close} />}

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
                <th>On loan</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
