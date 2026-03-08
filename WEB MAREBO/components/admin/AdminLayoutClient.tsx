'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminAuthDropdown from '@/components/admin/AdminAuthDropdown'
import { ReactNode } from 'react'

const SESSION_KEY = 'marebo_session'

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY)
      if (session) {
        const parsed = JSON.parse(session)
        if (parsed?.role === 'admin') {
          if (pathname === '/admin') {
            router.replace('/admin/productos')
          } else {
            setAllowed(true)
          }
        } else {
          router.replace('/?error=acceso-denegado')
        }
      } else {
        router.replace('/?error=acceso-denegado')
      }
    } catch {
      router.replace('/?error=acceso-denegado')
    }
    setChecked(true)
  }, [router, pathname])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (!checked) return null
  if (!allowed) return null

  return (
    <div className="flex min-h-screen bg-[#f8f8f7]">

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-60 md:min-h-screen">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 left-0 h-full z-50 md:hidden">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 hover:bg-secondary rounded-sm transition-colors"
            aria-label="Abrir menú"
            suppressHydrationWarning
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Mobile logo */}
          <span className="md:hidden font-serif text-sm tracking-[0.18em] uppercase">MAREBO :)</span>

          <div className="flex items-center gap-3 ml-auto">
            <AdminAuthDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
