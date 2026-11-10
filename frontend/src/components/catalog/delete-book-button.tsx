'use client'

import { useTransition } from 'react'
import type { Book } from '@/lib/types'
import { deleteBook } from '@/actions/books'

export function DeleteBookButton({ book, onError }: { book: Book; onError: (message: string) => void }) {
  const [pending, startTransition] = useTransition()

  const remove = () => {
    if (!confirm(`Delete “${book.title}” and its ${book.total} ${book.total === 1 ? 'copy' : 'copies'}? This can’t be undone.`)) return
    startTransition(async () => {
      const result = await deleteBook(book.id)
      if (result.error) onError(result.error)
    })
  }

  return (
    <button type="button" className="btn btn-sm btn-danger" disabled={pending} onClick={remove}>
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
