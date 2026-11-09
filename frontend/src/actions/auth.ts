'use server'

import { redirect } from 'next/navigation'
import { adoptSessionCookie, api, apiResponse, formError } from '@/lib/api'
import type { FormState } from '@/lib/types'

/** Only same-site paths: `//evil.com` or `https://…` must not become an open redirect. */
function safeTarget(value: FormDataEntryValue | null) {
  const target = typeof value === 'string' ? value : ''
  return target.startsWith('/') && !target.startsWith('//') ? target : '/'
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const res = await apiResponse('/auth/login', {
      method: 'POST',
      body: { email: form.get('email'), password: form.get('password') },
    })
    await adoptSessionCookie(res)
  } catch (error) {
    return formError(error)
  }
  // redirect() throws, so it stays outside the try.
  redirect(safeTarget(form.get('redirect')))
}

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  if (form.get('password') !== form.get('confirm')) return { error: 'Passwords do not match' }
  try {
    const res = await apiResponse('/auth/register', {
      method: 'POST',
      body: { name: form.get('name'), email: form.get('email'), password: form.get('password') },
    })
    await adoptSessionCookie(res)
  } catch (error) {
    return formError(error)
  }
  redirect('/')
}

export async function forgotPassword(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/auth/forgot-password', { method: 'POST', body: { email: form.get('email') } })
    return { ok: 'sent' }
  } catch (error) {
    return formError(error)
  }
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  if (form.get('password') !== form.get('confirm')) return { error: 'Passwords do not match' }
  try {
    await api('/auth/reset-password', {
      method: 'POST',
      body: { token: form.get('token'), password: form.get('password') },
    })
    return { ok: 'updated' }
  } catch (error) {
    return formError(error)
  }
}

/** Called once from the verify page, not during render: the token is single-use. */
export async function verifyEmail(token: string): Promise<FormState> {
  try {
    await api('/auth/verify-email', { method: 'POST', body: { token } })
    return { ok: 'verified' }
  } catch (error) {
    return formError(error)
  }
}
