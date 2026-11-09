'use client'

import { useCallback, useState } from 'react'
import type { Book } from '@/lib/types'
import { AddBookForm } from './add-book-form'

/** Client side for instant search; the book list itself is rendered from server data. */
export function CatalogView({ books, canAdd }: { books: Book[]; canAdd: boolean }) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const close = useCallback(() => setShowForm(false), [])

  const q = search.trim().toLowerCase()
  const filtered = books.filter(
    (b) => !q || [b.title, b.author, b.isbn, b.category].some((field) => field?.toLowerCase().includes(q)),
  )

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Catalog</h1>
          <p>{books.length} titles in the collection.</p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add book'}
          </button>
        )}
      </header>

      {/* Remounted each time it opens, so the form starts empty. */}
      {canAdd && showForm && <AddBookForm onDone={close} />}

      <div className="toolbar">
        <input
          className="input"
          type="search"
          placeholder="Search by title, author, ISBN…"
          aria-label="Search the catalog"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="toolbar-note">Greyed codes are on loan</span>
      </div>

      {!filtered.length ? (
        <div className="card">
          <div className="empty">
            {books.length ? 'No books match your search.' : 'The catalog is empty — add your first book.'}
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
