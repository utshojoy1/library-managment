import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = { title: 'Choose a new password' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams

  return (
    <div>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <h1>Invalid link</h1>
          <p className="sub">This password reset link is missing its token.</p>
          <Link href="/forgot-password" className="btn auth-submit">Request a new link</Link>
        </>
      )}

      <p className="auth-switch">
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  )
}
