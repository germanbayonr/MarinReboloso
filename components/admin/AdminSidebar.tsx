'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Package,
  FolderOpen,
  ShoppingCart,
  Settings,
  Store,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin/productos',   label: 'Productos',   icon: Package      },
  { href: '/admin/pedidos',     label: 'Pedidos',     icon: ShoppingCart },
  { href: '/admin/colecciones', label: 'Colecciones', icon: FolderOpen   },
  { href: '/admin/ajustes',     label: 'Ajustes',     icon: Settings     },
]

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <aside className="w-60 h-full bg-white border-r border-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/admin/productos" className="block" suppressHydrationWarning onClick={onClose}>
          <p className="font-serif text-base tracking-[0.18em] uppercase text-foreground leading-tight">
            MAREBO :)
          </p>
          <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
            Admin Panel
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Navegación del panel">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              suppressHydrationWarning
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm',
                isActive
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <Link
          href="/"
          suppressHydrationWarning
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors rounded-sm"
        >
          <Store className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
          Ver tienda
        </Link>
        <button
          onClick={handleLogout}
          suppressHydrationWarning
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors rounded-sm text-left"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
