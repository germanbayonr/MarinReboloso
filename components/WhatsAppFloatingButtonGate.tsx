'use client'

import { usePathname } from 'next/navigation'
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton'

/** Visible solo en la portada pública (`/`), no en admin ni en el resto de rutas. */
export default function WhatsAppFloatingButtonGate() {
  const pathname = usePathname()
  if (pathname !== '/') return null
  return <WhatsAppFloatingButton />
}
