'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'wayfar.meri@gmail.com'
const ADMIN_PASSWORD = 'admin123'
const SESSION_KEY = 'marebo_session'

interface AuthContextType {
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => 'admin' | 'user' | false
  logout: () => void
  email: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY)
      if (session) {
        const parsed = JSON.parse(session)
        if (parsed?.email) {
          setIsAuthenticated(true)
          setEmail(parsed.email)
          setIsAdmin(parsed.email === ADMIN_EMAIL)
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [])

  const login = (emailInput: string, passwordInput: string): 'admin' | 'user' | false => {
    if (emailInput === ADMIN_EMAIL && passwordInput === ADMIN_PASSWORD) {
      const session = { email: emailInput, role: 'admin' }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setIsAuthenticated(true)
      setIsAdmin(true)
      setEmail(emailInput)
      return 'admin'
    }
    // Future non-admin users: authenticate but stay on public site
    // For now only admin credentials are valid
    return false
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
    setIsAdmin(false)
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout, email }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
