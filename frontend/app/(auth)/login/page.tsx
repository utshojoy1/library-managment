'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { SessionUser } from '@/lib/format'

function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const notice = params.get('reset')
    ? 'Password updated. Sign in with your new password.'
    : params.get('verified')
      ? 'Email verified — welcome aboard.'
      : ''

  // Only same-site paths: `//evil.com` or `https://…` must not become an open redirect.
  const redirect = params.get('redirect') ?? '/'
  const target = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      setUser(await api<SessionUser>('/auth/login', { method: 'POST', body: { email, password } }))
      router.replace(target)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div>
      <h1>Welcome back</h1>
      <p className="sub">Sign in to manage the collection.</p>

      {notice && <div className="banner banner-ok">{notice}</div>}
      {error && <div className="banner banner-error">{error}</div>}

      <form onSubmit={submit}>
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
          <input
            id="password"
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
