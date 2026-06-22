'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, LogIn, Mail, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ADMIN_PANEL_EMAIL } from '@/lib/admin-config'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const inputClass =
  'w-full border border-neutral-200 px-3 py-2.5 pl-10 text-sm focus:border-neutral-400 focus:outline-none'

export default function AdminLoginClient() {
  const router = useRouter()
  const { login, requestPasswordReset } = useAuth()
  const [email, setEmail] = useState(ADMIN_PANEL_EMAIL)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState(ADMIN_PANEL_EMAIL)
  const [forgotError, setForgotError] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (trimmed.toLowerCase() !== ADMIN_PANEL_EMAIL.toLowerCase()) {
      setError('Solo el correo de administración autorizado puede acceder al panel.')
      return
    }
    setSubmitting(true)
    try {
      const result = await login(trimmed, password)
      if (result === 'admin') {
        toast.success('Sesión iniciada')
        router.push('/admin')
        router.refresh()
        return
      }
      if (result === 'user') {
        await supabase.auth.signOut()
        setError('Esta cuenta no tiene permisos de administración.')
        return
      }
      setError('Correo o contraseña incorrectos.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgot = async () => {
    setForgotError('')
    setForgotSubmitting(true)
    try {
      const res = await requestPasswordReset(forgotEmail)
      if (res.error) {
        setForgotError(res.error)
        return
      }
      toast.success('Revisa tu correo: te hemos enviado un enlace para restablecer la contraseña.')
      setForgotOpen(false)
    } finally {
      setForgotSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-4">
      <div className="w-full max-w-md border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="font-serif text-2xl tracking-wide text-neutral-900">Panel Marebo</p>
        <p className="mt-2 text-sm text-neutral-500">
          Acceso restringido a <span className="font-medium text-neutral-700">{ADMIN_PANEL_EMAIL}</span>
        </p>

        <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Correo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                className={inputClass}
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className={cn(inputClass, 'pr-10')}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setForgotEmail(email.trim() || ADMIN_PANEL_EMAIL)
              setForgotError('')
              setForgotOpen(true)
            }}
            className="text-xs text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-800"
          >
            ¿Contraseña olvidada?
          </button>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 bg-neutral-900 py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {submitting ? 'Entrando…' : 'Entrar al panel'}
          </button>
        </form>

        <Link href="/" className="mt-6 inline-block text-xs text-neutral-500 underline hover:text-neutral-800">
          ← Volver a la tienda
        </Link>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg tracking-wide">Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Introduce el correo de administración. Supabase enviará un enlace para establecer una nueva contraseña (sincronizada con Auth).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value)
                setForgotError('')
              }}
              placeholder={ADMIN_PANEL_EMAIL}
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
            />
            {forgotError ? <p className="text-xs text-red-600">{forgotError}</p> : null}
            <button
              type="button"
              disabled={forgotSubmitting}
              onClick={() => void handleForgot()}
              className="w-full bg-neutral-900 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50"
            >
              {forgotSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
