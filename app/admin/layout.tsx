import { ReactNode } from 'react'
import { ProductsProvider } from '@/lib/products-context'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export const metadata = {
  title: 'Marebo Jewelry Admin',
  description: 'Panel de administración de Marebo Jewelry',
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
