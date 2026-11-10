'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import type { Book } from '@/lib/types'
import { AddBookForm } from './add-book-form'
import { DeleteBookButton } from './delete-book-button'

const ALL = ''
const NONE = '\0none' // can't collide with a real genre name

/** Client side for instant search and genre filter; the book list itself is rendered from server data. */
export function CatalogView({ books, canEdit }: { books: Book[]; canEdit: boolean }) {
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState(ALL)
  // Which form is open: none, a new book, or the book being edited.
  const [editing, setEditing] = useState<Book | 'new' | null>(null)
  const [error, setError] = useState('')
  const close = useCallback(() => setEditing(null), [])

  const genres = [...new Set(books.flatMap((b) => (b.category ? [b.category] : [])))].sort((a, b) => a.localeCompare(b))
  const hasUncategorized = books.some((b) => !b.category)

  const q = search.trim().toLowerCase()
  const filtered = books.filter(
    (b) =>
      (genre === ALL || (genre === NONE ? !b.category : b.category === genre)) &&
      (!q || [b.title, b.author, b.isbn, b.category].some((field) => field?.toLowerCase().includes(q))),
  )

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Catalog</h1>
          <p>{books.length} titles in the collection.</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setEditing(editing ? null : 'new')}>
            {editing ? 'Cancel' : 'Add book'}
          </button>
        )}
      </header>

      {/* Keyed, so it remounts with fresh fields whenever a different book (or a new one) is opened. */}
      {canEdit && editing && (
        <AddBookForm
          key={editing === 'new' ? 'new' : editing.id}
          book={editing === 'new' ? undefined : editing}
          categories={genres}
          onDone={close}
        />
      )}

      {error && (
        <div className="banner banner-error" role="alert">
          {error}{' '}
          <button type="button" className="link-sm" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="toolbar">
        <input
          className="input"
          type="search"
          placeholder="Search by title, author, ISBN…"
          aria-label="Search the catalog"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input genre-select" aria-label="Filter by genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value={ALL}>All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
          {hasUncategorized && <option value={NONE}>No genre</option>}
        </select>
        <span className="toolbar-note">Greyed codes are borrowed</span>
      </div>

      {!filtered.length ? (
        <div className="card">
          <div className="empty">
            {books.length ? 'No books match your search or genre.' : 'The catalog is empty — add your first book.'}
          </div>
        </div>
      ) : (
        <div className="book-grid">
          {filtered.map((book) => (
            <article key={book.id} className="book-card">
              {book.category && (
                <span className="chip chip-indigo" style={{ alignSelf: 'flex-start' }}>{book.category}</span>
              )}
              <h3>
                {/* Stretched over the whole card (see .book-link), so the card opens the book page. */}
                <Link href={`/dashboard/catalog/${book.id}`} className="book-link">{book.title}</Link>
              </h3>
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
                      title={copy.status === 'available' ? 'Available' : 'Borrowed'}
                    >
                      {copy.barcode}
                    </span>
                  ))}
                </div>
              )}

              {canEdit && (
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setEditing(book)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Edit
                  </button>
                  <DeleteBookButton book={book} onError={setError} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
