'use server'

import { revalidatePath } from 'next/cache'
import { api, formError } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { FormState } from '@/lib/types'

// The API checks the session and the staff role; these only forward the forms.

export async function checkout(_prev: FormState, form: FormData): Promise<FormState> {
  let res: { bookTitle: string; memberName: string; dueAt: string }
  try {
    res = await api('/loans/checkout', {
      method: 'POST',
      body: { memberNo: form.get('memberNo'), barcode: form.get('barcode'), dueDate: form.get('dueDate') || undefined },
    })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout') // every dashboard page + the sidebar activity feed
  return { ok: `Issued “${res.bookTitle}” to ${res.memberName} — due ${formatDate(res.dueAt)}.` }
}

export async function returnCopy(_prev: FormState, form: FormData): Promise<FormState> {
  let res: { bookTitle: string; daysLate: number }
  try {
    res = await api('/loans/return', { method: 'POST', body: { barcode: form.get('barcode') } })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout') // every dashboard page + the sidebar activity feed
  return {
    ok: res.daysLate
      ? `Returned “${res.bookTitle}” — ${res.daysLate} day(s) late.`
      : `Returned “${res.bookTitle}” on time.`,
  }
}
