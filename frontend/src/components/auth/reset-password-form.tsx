'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import type { FormState } from '@/lib/types'
import { resetPassword } from '@/actions/auth'
import { PasswordInput } from './password-input'

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {})
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  if (state.ok) {
    return (
      <>
        <h1>Password updated</h1>
        <p className="sub">Your password has been changed and all other sessions were signed out.</p>
        <Link href="/login?reset=1" className="btn btn-primary auth-submit">Sign in</Link>
      </>
    )
  }

  return (
    <>
      <h1>Choose a new password</h1>
      <p className="sub">Pick something at least 8 characters long.</p>

      {state.error && <div className="banner banner-error">{state.error}</div>}

      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <div className="field">
          <label className="label" htmlFor="password">New password</label>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary auth-submit" disabled={pending}>
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}
