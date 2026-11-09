'use server'

import { revalidatePath } from 'next/cache'
import { api, formError } from '@/lib/api'
import type { FormState } from '@/lib/types'

/** The API checks the session and the staff role; this only forwards the form. */
export async function createBook(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/books', {
      method: 'POST',
      body: {
        title: form.get('title'),
        author: form.get('author'),
        isbn: form.get('isbn'),
        category: form.get('category'),
        publishedYear: form.get('publishedYear'),
        copies: form.get('copies'),
      },
    })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/catalog')
  return { ok: 'Book added.' }
}
