'use client'

import { useActionState, useEffect, useState } from 'react'
import type { FormState } from '@/lib/types'
import { createBook } from '@/actions/books'

const EMPTY = { title: '', author: '', isbn: '', category: '', publishedYear: '', copies: '1' }

export function AddBookForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createBook, {})
  // Controlled, so a rejected submit keeps what was typed (React resets uncontrolled forms after an action).
  const [form, setForm] = useState(EMPTY)
  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (state.ok) onDone()
  }, [state, onDone])

  return (
    <section className="card" style={{ marginBottom: 18 }}>
      <div className="card-head"><h2>New title</h2></div>
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
            <label className="label" htmlFor="category">Category</label>
            <input id="category" name="category" className="input" placeholder="Fiction, Science…" value={form.category} onChange={set('category')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="year">Published year</label>
            <input id="year" name="publishedYear" className="input" type="number" min={1000} max={2100} value={form.publishedYear} onChange={set('publishedYear')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="copies">Copies to add</label>
            <input id="copies" name="copies" className="input" type="number" min={1} max={50} value={form.copies} onChange={set('copies')} />
          </div>
          <div className="actions full">
            <button type="button" className="btn" onClick={onDone}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Saving…' : 'Save book'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
