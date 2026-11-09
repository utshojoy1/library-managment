'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import type { FormState } from '@/lib/types'
import { login } from '@/actions/auth'
import { PasswordInput } from './password-input'

export function LoginForm({ redirectTo, notice }: { redirectTo: string; notice: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {})
  // Controlled, so a failed sign-in keeps the email (React resets uncontrolled forms after an action).
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div>
      <h1>Welcome back</h1>
      <p className="sub">Sign in to manage the collection.</p>

      {notice && !state.error && <div className="banner banner-ok">{notice}</div>}
      {state.error && <div className="banner banner-error">{state.error}</div>}

      <form action={action}>
        <input type="hidden" name="redirect" value={redirectTo} />
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            name="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <div className="label-row">
            <label className="label" htmlFor="password">Password</label>
            <Link href="/forgot-password" className="link-sm">Forgot password?</Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </div>
  )
}
