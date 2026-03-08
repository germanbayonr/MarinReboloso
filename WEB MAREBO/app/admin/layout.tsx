import { ReactNode } from 'react'
import { ProductsProvider } from '@/lib/products-context'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export const metadata = {
  title: 'Wayfar Admin',
  description: 'Panel de administración de Wayfar Brand',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProductsProvider>
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
    </ProductsProvider>
  )
}
