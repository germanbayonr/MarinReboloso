'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminAuthDropdown from '@/components/admin/AdminAuthDropdown'
import type { ReactNode } from 'react'

/**
 * Admin UI shell. Access control is enforced in middleware.ts (Supabase session + owner email).
 */
export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-[#f8f8f7]">
      <div className="hidden min-h-screen w-60 flex-col md:flex">
        <AdminSidebar />
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-0 top-0 z-50 h-full md:hidden">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-white px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-sm transition-colors hover:bg-secondary md:hidden"
            aria-label="Abrir menú"
            suppressHydrationWarning
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <span className="font-serif text-sm uppercase tracking-[0.18em] md:hidden">MAREBO :)</span>

          <div className="ml-auto flex items-center gap-3">
            <AdminAuthDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
