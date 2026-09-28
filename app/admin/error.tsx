'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin]', error)
  }, [error])

  const message = error.message?.trim() || 'Error inesperado en el panel de administración.'

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-red-700">Panel de administración</p>
      <h1 className="mt-2 font-serif text-2xl text-neutral-900">No se pudo cargar esta sección</h1>
      <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{message}</p>
      {message.includes('SUPABASE_SERVICE_ROLE') || message.includes('service_role') ? (
        <p className="mt-3 text-xs text-neutral-500">
          Revisa en Vercel (o tu hosting) que existan{' '}
          <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
          <code className="rounded bg-neutral-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>, luego vuelve a desplegar.
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Reintentar
        </button>
        <Link href="/admin/login" className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50">
          Ir al login
        </Link>
      </div>
    </div>
  )
}
