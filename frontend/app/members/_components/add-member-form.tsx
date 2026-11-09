'use client'

import { useActionState, useEffect, useState } from 'react'
import type { FormState } from '@/lib/types'
import { createMember } from '../actions'

const EMPTY = { name: '', email: '', phone: '' }

export function AddMemberForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createMember, {})
  // Controlled, so a rejected submit keeps what was typed (React resets uncontrolled forms after an action).
  const [form, setForm] = useState(EMPTY)
  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (state.ok) onDone()
  }, [state, onDone])

  return (
    <section className="card" style={{ marginBottom: 18 }}>
      <div className="card-head"><h2>New member</h2></div>
      <div className="card-body">
        {state.error && <div className="banner banner-error">{state.error}</div>}
        <form className="form-grid" action={action}>
          <div className="field full">
            <label className="label" htmlFor="name">Full name *</label>
            <input id="name" name="name" className="input" required value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" className="input" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" className="input" value={form.phone} onChange={set('phone')} />
          </div>
          <p className="full" style={{ margin: 0, color: 'var(--muted)', fontSize: 12.5 }}>
            A membership number is generated automatically (e.g. M004).
          </p>
          <div className="actions full">
            <button type="button" className="btn" onClick={onDone}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Saving…' : 'Save member'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
