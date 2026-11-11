'use client'

import { useTransition } from 'react'
import type { Book } from '@/lib/types'
import { deleteBook } from '@/actions/books'
import { useConfirm } from '@/components/confirm-dialog'

export function DeleteBookButton({ book, onError }: { book: Book; onError: (message: string) => void }) {
  const [pending, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete book?',
      message: `“${book.title}” and its ${book.total} ${book.total === 1 ? 'copy' : 'copies'} will be permanently removed. This can’t be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteBook(book.id)
      if (result.error) onError(result.error)
    })
  }

  return (
    <>
      <button type="button" className="btn btn-sm btn-danger" disabled={pending} onClick={remove}>
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {dialog}
    </>
  )
}
