'use server'

import { revalidatePath } from 'next/cache'
import { api, apiResponse, formError } from '@/lib/api'
import type { FormState } from '@/lib/types'

const bookFields = (form: FormData) => ({
  title: form.get('title'),
  author: form.get('author'),
  isbn: form.get('isbn'),
  category: form.get('category'),
  publishedYear: form.get('publishedYear'),
})

// The API checks the session and the staff role; these only forward the form.

export async function createBook(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/books', { method: 'POST', body: { ...bookFields(form), copies: form.get('copies') } })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout') // every dashboard page + the sidebar activity feed
  return { ok: 'Book added.' }
}

export async function updateBook(id: number, _prev: FormState, form: FormData): Promise<FormState> {
  try {
    await api(`/books/${id}`, { method: 'PUT', body: bookFields(form) })
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout') // every dashboard page + the sidebar activity feed
  return { ok: 'Book updated.' }
}

export async function deleteBook(id: number): Promise<FormState> {
  try {
    await apiResponse(`/books/${id}`, { method: 'DELETE' }) // 204: no JSON body to parse
  } catch (error) {
    return formError(error)
  }
  revalidatePath('/dashboard', 'layout') // every dashboard page + the sidebar activity feed
  return { ok: 'Book deleted.' }
}
