import type { Metadata } from 'next'
import Link from 'next/link'
import { VerifyEmail } from '@/components/auth/verify-email'

export const metadata: Metadata = { title: 'Verify your email' }

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div>
        <h1>Link not valid</h1>
        <p className="sub">This link is missing its token.</p>
        <Link href="/login" className="btn auth-submit">Back to sign in</Link>
      </div>
    )
  }
  return <VerifyEmail token={token} />
}
