import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/dal'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in' }

type Search = { redirect?: string; reset?: string; verified?: string }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  // Already signed in (and the session is still valid): skip the form.
  if (await getUser()) redirect('/')

  const params = await searchParams
  const notice = params.reset
    ? 'Password updated. Sign in with your new password.'
    : params.verified
      ? 'Email verified — welcome aboard.'
      : ''

  // The server action re-checks this target before redirecting.
  return <LoginForm redirectTo={params.redirect ?? '/'} notice={notice} />
}
