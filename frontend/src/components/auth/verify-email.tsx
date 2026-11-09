'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { FormState } from '@/lib/types'
import { verifyEmail } from '@/actions/auth'

/**
 * Redeems the link from the browser, after the page loads, rather than during server
 * render: the token is single-use, and prefetches or link scanners must not spend it.
 */
export function VerifyEmail({ token }: { token: string }) {
  const [result, setResult] = useState<FormState | null>(null)
  // React dev mode runs effects twice; post the token only once.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    verifyEmail(token).then(setResult, () => setResult({ error: 'Could not reach the server. Try again.' }))
  }, [token])

  if (!result) {
    return (
      <div>
        <h1>Verifying your email</h1>
        <p className="sub">One moment…</p>
      </div>
    )
  }

  if (result.ok) {
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
      <p className="sub">{result.error}</p>
      <Link href="/login" className="btn auth-submit">Back to sign in</Link>
    </div>
  )
}
