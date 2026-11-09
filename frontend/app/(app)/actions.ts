'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { api, apiResponse, formError, SESSION_COOKIE } from '@/lib/api'
import type { FormState } from '@/lib/types'

export async function signOut() {
  // Best effort: the API forgets the session; the cookie is cleared either way.
  await apiResponse('/auth/logout', { method: 'POST' }).catch(() => {})
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/login')
}

export async function resendVerification(): Promise<FormState> {
  try {
    await api('/auth/resend-verification', { method: 'POST' })
    return { ok: 'Sent — check your inbox.' }
  } catch (error) {
    return formError(error)
  }
}
