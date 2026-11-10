'use client'

import { useActionState, useEffect, useState } from 'react'
import type { Book, FormState } from '@/lib/types'
import { createBook, updateBook } from '@/actions/books'

const EMPTY = { title: '', author: '', isbn: '', category: '', publishedYear: '', copies: '1' }

/** Adds a book, or edits `book` when given (copies are only set when adding). */
export function AddBookForm({ book, categories, onDone }: { book?: Book; categories: string[]; onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    book ? updateBook.bind(null, book.id) : createBook,
    {},
  )
  // Controlled, so a rejected submit keeps what was typed (React resets uncontrolled forms after an action).
  const [form, setForm] = useState(
    book
      ? {
          title: book.title,
          author: book.author,
          isbn: book.isbn ?? '',
          category: book.category ?? '',
          publishedYear: book.publishedYear?.toString() ?? '',
          copies: '',
        }
      : EMPTY,
  )
  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (state.ok) onDone()
  }, [state, onDone])

  return (
    <section className="card" style={{ marginBottom: 18 }}>
      <div className="card-head"><h2>{book ? `Edit “${book.title}”` : 'New title'}</h2></div>
      <div className="card-body">
        {state.error && <div className="banner banner-error">{state.error}</div>}
        <form className="form-grid" action={action}>
          <div className="field full">
            <label className="label" htmlFor="title">Title *</label>
            <input id="title" name="title" className="input" required value={form.title} onChange={set('title')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="author">Author *</label>
            <input id="author" name="author" className="input" required value={form.author} onChange={set('author')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="isbn">ISBN</label>
            <input id="isbn" name="isbn" className="input" value={form.isbn} onChange={set('isbn')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="category">Genre</label>
            {/* Suggests existing genres so the filter doesn't split "Science" and "science". */}
            <input id="category" name="category" className="input" list="genre-options" placeholder="Fiction, Science…" value={form.category} onChange={set('category')} />
            <datalist id="genre-options">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="field">
            <label className="label" htmlFor="year">Published year</label>
            <input id="year" name="publishedYear" className="input" type="number" min={1000} max={2100} value={form.publishedYear} onChange={set('publishedYear')} />
          </div>
          {!book && (
            <div className="field">
              <label className="label" htmlFor="copies">Copies to add</label>
              <input id="copies" name="copies" className="input" type="number" min={1} max={50} value={form.copies} onChange={set('copies')} />
            </div>
          )}
          <div className="actions full">
            <button type="button" className="btn" onClick={onDone}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Saving…' : book ? 'Save changes' : 'Save book'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
