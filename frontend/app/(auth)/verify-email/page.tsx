'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { SessionUser } from '@/lib/format'

function Verify() {
  const token = useSearchParams().get('token') ?? ''
  const { setUser } = useAuth()
  const [state, setState] = useState<'verifying' | 'done' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  // The token is single-use; React dev mode runs effects twice, so post it only once.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (!token) {
      setState('error')
      setMessage('This link is missing its token.')
      return
    }

    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then(async () => {
        setState('done')
        // Refresh the session so the "verify your email" banner disappears.
        await api<SessionUser>('/auth/me').then(setUser, () => {})
      })
      .catch((e) => {
        setState('error')
        setMessage(errorMessage(e))
      })
  }, [token, setUser])

  if (state === 'verifying') {
    return (
      <div>
        <h1>Verifying your email</h1>
        <p className="sub">One moment…</p>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div>
        <h1>Email verified</h1>
        <p className="sub">Thanks — your account is confirmed. Overdue reminders and receipts can now reach you.</p>
        <Link href="/" className="btn btn-primary auth-submit">Go to dashboard</Link>
      </div>
    )
  }

  return (
    <div>
      <h1>Link not valid</h1>
      <p className="sub">{message}</p>
      <Link href="/login" className="btn auth-submit">Back to sign in</Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  )
}
