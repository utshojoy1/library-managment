import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { members, users } from '../../db/schema'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!name) throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address' })
  if (password.length < 8) throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })

  try {
    const user = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({ name, email, passwordHash: hashPassword(password), role: 'member' })
        .returning()

      // Self-registered accounts also get a library card, so staff can lend to them.
      const [member] = await tx
        .insert(members)
        .values({ userId: created!.id, memberNo: `TMP-${Date.now()}`, name, email })
        .returning()

      const [linked] = await tx
        .update(members)
        .set({ memberNo: `M${String(member!.id).padStart(3, '0')}` })
        .where(eq(members.id, member!.id))
        .returning()

      return { ...created!, memberNo: linked!.memberNo }
    })

    await createSession(event, user.id)
    return { ...publicUser(user), memberNo: user.memberNo }
  } catch (error) {
    const code = (error as { code?: string; cause?: { code?: string } }).code
      ?? (error as { cause?: { code?: string } }).cause?.code
    if (code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
    }
    throw error
  }
})
