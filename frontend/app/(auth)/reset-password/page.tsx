'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { api, errorMessage } from '@/lib/api'

function ResetForm() {
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match')
    setBusy(true)
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } })
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {done ? (
        <>
          <h1>Password updated</h1>
          <p className="sub">Your password has been changed and all other sessions were signed out.</p>
          <Link href="/login?reset=1" className="btn btn-primary auth-submit">Sign in</Link>
        </>
      ) : !token ? (
        <>
          <h1>Invalid link</h1>
          <p className="sub">This password reset link is missing its token.</p>
          <Link href="/forgot-password" className="btn auth-submit">Request a new link</Link>
        </>
      ) : (
        <>
          <h1>Choose a new password</h1>
          <p className="sub">Pick something at least 8 characters long.</p>

          {error && <div className="banner banner-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="password">New password</label>
              <input id="password" className="input" type="password" autoComplete="new-password" minLength={8} required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" className="input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </>
      )}

      <p className="auth-switch">
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
