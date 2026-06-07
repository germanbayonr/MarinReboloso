import { Suspense } from 'react'
import NuevoProductoClient from '@/components/admin/NuevoProductoClient'

export default function NuevoProductoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando formulario…</p>}>
      <NuevoProductoClient />
    </Suspense>
  )
}
