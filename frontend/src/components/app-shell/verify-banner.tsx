'use client'

import { useActionState } from 'react'
import type { FormState } from '@/lib/types'
import { resendVerification } from '@/actions/session'

export function VerifyBanner({ email }: { email: string }) {
  const [state, resend, pending] = useActionState<FormState>(resendVerification, {})

  return (
    <div className="verify-banner">
      <div>
        <strong>Verify your email</strong>
        <span>We sent a confirmation link to {email}.</span>
        {(state.ok || state.error) && <span className="verify-msg">{state.ok ?? state.error}</span>}
      </div>
      <form action={resend}>
        <button type="submit" className="btn btn-sm" disabled={pending}>
          {pending ? 'Sending…' : 'Resend'}
        </button>
      </form>
    </div>
  )
}
