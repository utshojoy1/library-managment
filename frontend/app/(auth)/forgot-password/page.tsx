'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } })
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {!sent ? (
        <>
          <h1>Reset your password</h1>
          <p className="sub">Enter your email and we&apos;ll send you a link to choose a new password.</p>

          {error && <div className="banner banner-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1>Check your inbox</h1>
          <p className="sub">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in one hour.
          </p>
          <Link href="/login" className="btn auth-submit">Back to sign in</Link>
        </>
      )}

      <p className="auth-switch">
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  )
}
