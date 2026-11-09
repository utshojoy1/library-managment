import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { verifySession } from '@/lib/dal'
import { STAFF, type Book } from '@/lib/types'
import { CatalogView } from './_components/catalog-view'

export const metadata: Metadata = { title: 'Catalog' }

export default async function CatalogPage() {
  const user = await verifySession()
  const books = await api<Book[]>('/books')
  return <CatalogView books={books} canAdd={STAFF.includes(user.role)} />
}
