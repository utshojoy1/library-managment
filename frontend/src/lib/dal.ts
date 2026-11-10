import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { ApiError, api } from './api'
import type { Role, SessionUser } from './types'

/**
 * Data access layer: the secure session check. proxy.ts only looks for the cookie;
 * this asks the API whether it is still valid. `cache` dedupes it within one render.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  try {
    return await api<SessionUser>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
})

/** The signed-in user, or a redirect to /login. */
export async function verifySession() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  return user
}

/** The signed-in user if their role is allowed; others go to the dashboard. The API enforces the same rule. */
export async function requireRole(roles: Role[]) {
  const user = await verifySession()
  if (!roles.includes(user.role)) redirect('/dashboard')
  return user
}
