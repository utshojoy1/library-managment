'use server'

import { revalidatePath } from 'next/cache'
import { api, formError } from '@/lib/api'
import type { FormState } from '@/lib/types'

/** The API checks the session and the staff role; this only forwards the form. */
export async function createMember(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/members', {
      method: 'POST',
      body: { name: form.get('name'), email: form.get('email'), phone: form.get('phone') },
    })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/members')
  return { ok: 'Member added.' }
}
