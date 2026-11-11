'use server'

import { revalidatePath } from 'next/cache'
import { api, apiResponse, formError } from '@/lib/api'
import type { FormState } from '@/lib/types'

/** The API checks the session and the staff role; this only forwards the form. */
export async function createMember(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/members', {
      method: 'POST',
      // Empty password = no login account; omit it so the API's optional check skips it.
      body: { name: form.get('name'), email: form.get('email'), phone: form.get('phone'), password: form.get('password') || undefined },
    })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout') // every dashboard page + the sidebar activity feed
  return { ok: 'Member added.' }
}

// Edit, status and delete are super admin only; setting a password is any staff. The API enforces both.

export async function updateMember(id: number, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    await api(`/members/${id}`, {
      method: 'PUT',
      body: { name: form.get('name'), email: form.get('email'), phone: form.get('phone') },
    })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout')
  // Empty = keep the current password. Details are already saved if this step fails.
  const password = form.get('password')
  if (password) {
    try {
      await apiResponse(`/members/${id}/password`, { method: 'PUT', body: { password } })
    } catch (error) {
      const failed = formError(error)
      return { error: `Details saved, but the password wasn’t changed: ${failed.error}` }
    }
  }
  return { ok: 'Member updated.' }
}

export async function setMemberStatus(id: number, isActive: boolean): Promise<FormState> {
  try {
    await api(`/members/${id}/status`, { method: 'PATCH', body: { isActive } })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: isActive ? 'Member enabled.' : 'Member disabled.' }
}

export async function deleteMember(id: number): Promise<FormState> {
  try {
    await apiResponse(`/members/${id}`, { method: 'DELETE' }) // 204: no JSON body to parse
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: 'Member deleted.' }
}

export async function setMemberPassword(id: number, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    await apiResponse(`/members/${id}/password`, { method: 'PUT', body: { password: form.get('password') } }) // 204
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout') // the change shows in the activity feed
  return { ok: 'Password updated. They’ve been signed out everywhere.' }
}
