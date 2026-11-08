'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import type { SessionUser } from './format'

// undefined = still loading, null = signed out.
type AuthState = { user: SessionUser | null | undefined; setUser: (user: SessionUser | null) => void }

const AuthContext = createContext<AuthState>({ user: undefined, setUser: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined)

  useEffect(() => {
    api<SessionUser>('/auth/me').then(setUser, () => setUser(null))
  }, [])

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const { user, setUser } = useContext(AuthContext)
  const role = user?.role
  return {
    user,
    setUser,
    isStaff: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
  }
}
