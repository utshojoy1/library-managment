'use client'

import { useState, type FormEvent } from 'react'
import { api, errorMessage, useApi } from '@/lib/api'
import { formatDate } from '@/lib/format'

type Member = {
  id: number
  memberNo: string
  name: string
  email: string | null
  phone: string | null
  joinedAt: string
  activeLoans: number
}

const EMPTY_FORM = { name: '', email: '', phone: '' }

export default function MembersPage() {
  const { data: members, refresh } = useApi<Member[]>('/members')
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const set = (field: keyof typeof EMPTY_FORM) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function addMember(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/members', { method: 'POST', body: form })
      await refresh()
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Members</h1>
          <p>{members?.length ?? 0} registered borrowers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add member'}
        </button>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      {showForm && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="card-head"><h2>New member</h2></div>
          <div className="card-body">
            <form className="form-grid" onSubmit={addMember}>
              <div className="field full">
                <label className="label" htmlFor="name">Full name *</label>
                <input id="name" className="input" value={form.name} onChange={set('name')} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="email">Email</label>
                <input id="email" className="input" type="email" value={form.email} onChange={set('email')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" className="input" value={form.phone} onChange={set('phone')} />
              </div>
              <p className="full" style={{ margin: 0, color: 'var(--muted)', fontSize: 12.5 }}>
                A membership number is generated automatically (e.g. M004).
              </p>
              <div className="actions full">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save member'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="card">
        {!members?.length ? (
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
