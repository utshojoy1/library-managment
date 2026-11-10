'use server'

import { revalidatePath } from 'next/cache'
import { api, formError } from '@/lib/api'
import type { FormState, Role } from '@/lib/types'

/** The API checks the super-admin role and the "keep one super admin" rule. */
export async function updateUser(id: number, patch: { role?: Role; isActive?: boolean }): Promise<FormState> {
  try {
    await api(`/admin/users/${Number(id)}`, { method: 'PATCH', body: patch })
    return {}
  } catch (error) {
    return formError(error)
  } finally {
    // Refresh either way, so a rejected change snaps back to the stored value.
    revalidatePath('/dashboard/admin/users')
  }
}
