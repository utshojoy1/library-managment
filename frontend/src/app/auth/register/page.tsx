import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/dal'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'Create an account' }

export default async function RegisterPage() {
  if (await getUser()) redirect('/')
  return <RegisterForm />
}
