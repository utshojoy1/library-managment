'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { SessionUser } from '@/lib/format'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setBusy(true)
    try {
      const { name, email, password } = form
      setUser(await api<SessionUser>('/auth/register', { method: 'POST', body: { name, email, password } }))
      router.replace('/')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div>
      <h1>Create an account</h1>
      <p className="sub">Membership accounts can browse the catalog and track their loans.</p>

      {error && <div className="banner banner-error">{error}</div>}

      <form onSubmit={submit}>
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
          <input id="password" className="input" type="password" name="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={set('password')} />
          <small className="field-hint">At least 8 characters.</small>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input id="confirm" className="input" type="password" name="confirmPassword" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} />
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </div>
  )
}
