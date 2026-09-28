'use client'

import { usePathname } from 'next/navigation'
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton'

/** Botón flotante en tienda pública (no en admin). */
export default function WhatsAppFloatingButtonGate() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <WhatsAppFloatingButton />
}
