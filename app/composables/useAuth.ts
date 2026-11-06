export type Role = 'super_admin' | 'admin' | 'member'

export type SessionUser = {
  id: number
  email: string
  name: string
  role: Role
  memberNo?: string
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  member: 'Member',
}

export function useAuthUser() {
  return useState<SessionUser | null>('auth-user', () => null)
}

export function useAuth() {
  const user = useAuthUser()
  const role = computed(() => user.value?.role ?? null)
  const isSuperAdmin = computed(() => role.value === 'super_admin')
  const isStaff = computed(() => role.value === 'admin' || role.value === 'super_admin')
  const isMember = computed(() => role.value === 'member')

  return { user, role, isSuperAdmin, isStaff, isMember }
}
