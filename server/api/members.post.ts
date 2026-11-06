import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { members } from '../db/schema'

export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)

  const body = await readBody(event).catch(() => ({}))
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim() || null
  const phone = String(body?.phone ?? '').trim() || null

  if (!name) throw createError({ statusCode: 400, statusMessage: 'Name is required' })

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(members)
      .values({ memberNo: `TMP-${Date.now()}`, name, email, phone })
      .returning()

    const memberNo = `M${String(row!.id).padStart(3, '0')}`
    const [member] = await tx
      .update(members)
      .set({ memberNo })
      .where(eq(members.id, row!.id))
      .returning()

    return member
  })
})
