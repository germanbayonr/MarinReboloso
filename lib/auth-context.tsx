'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { ADMIN_PANEL_EMAIL, isAdminPanelEmail } from '@/lib/admin-config'
import { supabase } from '@/lib/supabase'

export const ADMIN_EMAIL = ADMIN_PANEL_EMAIL

export function isAdminUser(user: User | null | undefined) {
  return isAdminPanelEmail(user?.email)
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  email: string | null
  /** @deprecated use signInWithPassword */
  login: (email: string, password: string) => Promise<'admin' | 'user' | false>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user ?? null)
  }, [])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { error: error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message }
    return { error: null }
  }, [])

  const login = useCallback(
    async (emailInput: string, passwordInput: string): Promise<'admin' | 'user' | false> => {
      const { error } = await signInWithPassword(emailInput, passwordInput)
      if (error) return false
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (!u) return false
      return isAdminUser(u) ? 'admin' : 'user'
    },
    [signInWithPassword],
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: isAdminUser(user),
      email: user?.email ?? null,
      login,
      signInWithPassword,
      logout,
      refreshUser,
    }),
    [user, session, loading, login, signInWithPassword, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
