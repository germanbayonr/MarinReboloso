import { ReactNode } from 'react'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export const metadata = {
  title: 'Marebo Jewelry Admin',
  description: 'Panel de administración de Marebo Jewelry',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminLayoutClient>{children}</AdminLayoutClient>
  )
}
