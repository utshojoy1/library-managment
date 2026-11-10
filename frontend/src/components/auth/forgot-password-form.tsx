'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import type { FormState } from '@/lib/types'
import { forgotPassword } from '@/actions/auth'

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPassword, {})
  const [email, setEmail] = useState('')

  return (
    <div>
      {!state.ok ? (
        <>
          <h1>Reset your password</h1>
          <p className="sub">Enter your email and we&apos;ll send you a link to choose a new password.</p>

          {state.error && <div className="banner banner-error">{state.error}</div>}

          <form action={action}>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" className="input" type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={pending}>
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1>Check your inbox</h1>
          <p className="sub">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in one hour.
          </p>
          <Link href="/auth/login" className="btn auth-submit">Back to sign in</Link>
        </>
      )}

      <p className="auth-switch">
        <Link href="/auth/login">Back to sign in</Link>
      </p>
    </div>
  )
}
