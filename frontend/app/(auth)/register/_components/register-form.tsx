'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import type { FormState } from '@/lib/types'
import { register } from '../../actions'
import { PasswordInput } from '../../_components/password-input'

const EMPTY = { name: '', email: '', password: '', confirm: '' }

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {})
  // Controlled, so a rejected sign-up keeps what was typed.
  const [form, setForm] = useState(EMPTY)
  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div>
      <h1>Create an account</h1>
      <p className="sub">Membership accounts can browse the catalog and track their loans.</p>

      {state.error && <div className="banner banner-error">{state.error}</div>}

      <form action={action}>
        <div className="field">
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" name="name" autoComplete="name" required autoFocus value={form.name} onChange={set('name')} />
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" name="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={form.email} onChange={set('email')} />
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={set('password')} />
          <small className="field-hint">At least 8 characters.</small>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} />
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </div>
  )
}
