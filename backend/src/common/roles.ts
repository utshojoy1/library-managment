export type Role = 'super_admin' | 'admin' | 'member'
export const ROLES: Role[] = ['super_admin', 'admin', 'member']
export const STAFF: Role[] = ['admin', 'super_admin']

export type SessionUser = {
  id: number
  email: string
  name: string
  role: Role
  emailVerified: boolean
}
