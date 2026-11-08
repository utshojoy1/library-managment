'use client'

import { useState, type FormEvent } from 'react'
import { api, errorMessage, useApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'

type Book = {
  id: number
  title: string
  author: string
  isbn: string | null
  category: string | null
  publishedYear: number | null
  total: number
  available: number
  copies: { barcode: string; status: string }[]
}

const EMPTY_FORM = { title: '', author: '', isbn: '', category: '', publishedYear: '', copies: '1' }

export default function CatalogPage() {
  const { isStaff } = useAuth()
  const { data: books, refresh } = useApi<Book[]>('/books')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const set = (field: keyof typeof EMPTY_FORM) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const q = search.trim().toLowerCase()
  const filtered = (books ?? []).filter(
    (b) => !q || [b.title, b.author, b.isbn, b.category].some((field) => field?.toLowerCase().includes(q)),
  )

  async function addBook(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/books', { method: 'POST', body: form })
      await refresh()
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Catalog</h1>
          <p>{books?.length ?? 0} titles in the collection.</p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add book'}
          </button>
        )}
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      {isStaff && showForm && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="card-head"><h2>New title</h2></div>
          <div className="card-body">
            <form className="form-grid" onSubmit={addBook}>
              <div className="field full">
                <label className="label" htmlFor="title">Title *</label>
                <input id="title" className="input" value={form.title} onChange={set('title')} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="author">Author *</label>
                <input id="author" className="input" value={form.author} onChange={set('author')} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="isbn">ISBN</label>
                <input id="isbn" className="input" value={form.isbn} onChange={set('isbn')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="category">Category</label>
                <input id="category" className="input" value={form.category} onChange={set('category')} placeholder="Fiction, Science…" />
              </div>
              <div className="field">
                <label className="label" htmlFor="year">Published year</label>
                <input id="year" className="input" type="number" min={1000} max={2100} value={form.publishedYear} onChange={set('publishedYear')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="copies">Copies to add</label>
                <input id="copies" className="input" type="number" min={1} max={50} value={form.copies} onChange={set('copies')} />
              </div>
              <div className="actions full">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save book'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <div className="toolbar">
        <input
          className="input"
          type="search"
          placeholder="Search by title, author, ISBN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="toolbar-note">Greyed codes are on loan</span>
      </div>

      {!filtered.length ? (
        <div className="card">
          <div className="empty">
            {books?.length ? 'No books match your search.' : 'The catalog is empty — add your first book.'}
          </div>
        </div>
      ) : (
        <div className="book-grid">
          {filtered.map((book) => (
            <article key={book.id} className="book-card">
              {book.category && (
                <span className="chip chip-indigo" style={{ alignSelf: 'flex-start' }}>{book.category}</span>
              )}
              <h3>{book.title}</h3>
              <div className="author">{book.author}</div>
              <div className="meta">
                <span className="mono">{book.isbn || 'No ISBN'}</span>
                <span className={`chip ${book.available > 0 ? 'chip-green' : 'chip-red'}`}>
                  {book.available} / {book.total} available
                </span>
              </div>

              {book.copies.length > 0 && (
                <div className="copy-codes">
                  {book.copies.map((copy) => (
                    <span
                      key={copy.barcode}
                      className={`copy-code${copy.status !== 'available' ? ' taken' : ''}`}
                      title={copy.status === 'available' ? 'Available' : 'On loan'}
                    >
                      {copy.barcode}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
