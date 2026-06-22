'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-400 focus:outline-none'

export default function AdminResetPasswordClient() {
  const router = useRouter()
  const { updatePassword } = useAuth()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const markReady = () => {
      if (!cancelled) {
        setReady(true)
        setChecking(false)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') markReady()
    })

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session) {
        markReady()
        return
      }
      setChecking(false)
    })

    return () => {
      cancelled = true
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSubmitting(true)
    try {
      const res = await updatePassword(password)
      if (res.error) {
        setError(res.error)
        return
      }
      toast.success('Contraseña actualizada en Supabase')
      router.push('/admin')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-4">
      <div className="w-full max-w-md border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="font-serif text-xl tracking-wide text-neutral-900">Nueva contraseña</p>
        <p className="mt-2 text-sm text-neutral-500">
          El cambio se guarda en Supabase Auth. Usa la nueva contraseña para entrar al panel.
        </p>

        {checking ? (
          <p className="mt-8 text-sm text-neutral-500">Verificando enlace de recuperación…</p>
        ) : !ready ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-neutral-600">
              El enlace no es válido o ha caducado. Solicita uno nuevo desde «¿Contraseña olvidada?» al iniciar sesión.
            </p>
            <Link
              href="/"
              className="inline-block text-sm underline text-neutral-700 hover:text-neutral-900"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500">Nueva contraseña</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputClass, 'pl-10')}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={cn(inputClass, 'pl-10')}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-neutral-900 py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}

        <p className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
          <Mail className="h-3.5 w-3.5" />
          Acceso administración Marebo
        </p>
      </div>
    </div>
  )
}
