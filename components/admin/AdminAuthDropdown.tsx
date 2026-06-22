'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Mail, Lock, ChevronDown, LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth, isAdminUser } from '@/lib/auth-context'
import { ADMIN_PANEL_EMAIL } from '@/lib/admin-config'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const inputClass =
  'w-full pl-9 pr-3 py-2.5 text-sm bg-white/80 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-[box-shadow,background] rounded-none border-0 border-b border-foreground/15 focus:border-foreground/40'

export default function AdminAuthDropdown({ adminMode = false }: { adminMode?: boolean }) {
  const { user, loading, login, logout, requestPasswordReset } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [forgotEmail, setForgotEmail] = useState(ADMIN_PANEL_EMAIL)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const isAuthenticated = Boolean(user)
  const admin = isAdminUser(user)

  const handleLogin = async () => {
    setError('')
    setSubmitting(true)
    try {
      const trimmedEmail = emailInput.trim()
      if (adminMode && trimmedEmail.toLowerCase() !== ADMIN_PANEL_EMAIL.toLowerCase()) {
        setError('Solo el correo de administración autorizado puede acceder al panel.')
        return
      }

      const result = await login(trimmedEmail, passwordInput)
      if (result === 'admin') {
        toast.success('Sesión iniciada')
        setOpen(false)
        setEmailInput('')
        setPasswordInput('')
        window.location.href = '/admin'
      } else if (result === 'user') {
        if (adminMode) {
          await supabase.auth.signOut()
          setError('Esta cuenta no tiene permisos de administración.')
          return
        }
        toast.success('Bienvenida/o')
        setOpen(false)
        setEmailInput('')
        setPasswordInput('')
      } else {
        setError('Correo o contraseña incorrectos.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
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
      setOpen(false)
    } finally {
      setForgotSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setOpen(false)
    toast.message('Sesión cerrada')
    router.push('/')
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            suppressHydrationWarning
            className={cn(
              'flex items-center gap-1.5 outline-none transition-opacity hover:opacity-70',
              loading && 'pointer-events-none opacity-50',
            )}
            aria-label="Cuenta de usuario"
            type="button"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.25} />
            {isAuthenticated && <ChevronDown className="h-3 w-3" strokeWidth={1.25} />}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={10}
          className={cn(
            'w-[min(100vw-2rem,20rem)] border-0 bg-[#faf9f7] p-0 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]',
            'ring-1 ring-foreground/8',
          )}
        >
          <div className="p-6">
            {loading ? (
              <p className="font-serif text-sm tracking-wide text-muted-foreground">Cargando…</p>
            ) : isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 border-b border-foreground/10 pb-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <User className="h-4 w-4" strokeWidth={1.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm tracking-[0.12em] text-foreground">
                      {admin ? 'Administración' : 'Tu cuenta'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                {!admin && (
                  <Link
                    href="/mi-cuenta"
                    onClick={() => setOpen(false)}
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Mi cuenta y datos
                  </Link>
                )}
                {admin && (
                  <Link
                    href="/admin/productos"
                    onClick={() => setOpen(false)}
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Panel de administración
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  suppressHydrationWarning
                  className="w-full text-left text-sm text-muted-foreground transition-colors hover:text-destructive"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="font-serif text-base tracking-[0.14em] text-foreground">
                    {adminMode ? 'Acceso administración' : 'Acceso'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {adminMode
                      ? `Inicia sesión con ${ADMIN_PANEL_EMAIL} para entrar al panel.`
                      : 'Inicia sesión para guardar tu perfil y seguir tu experiencia en la boutique.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Correo electrónico</label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
                      strokeWidth={1.25}
                    />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value)
                        setError('')
                      }}
                      placeholder={adminMode ? ADMIN_PANEL_EMAIL : 'correo@ejemplo.com'}
                      className={inputClass}
                      suppressHydrationWarning
                      onKeyDown={(e) => e.key === 'Enter' && void handleLogin()}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contraseña</label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-0 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground/60"
                      strokeWidth={1.25}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value)
                        setError('')
                      }}
                      placeholder="••••••••"
                      className={cn(inputClass, 'pr-10')}
                      suppressHydrationWarning
                      onKeyDown={(e) => e.key === 'Enter' && void handleLogin()}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.25} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.25} />
                      )}
                    </button>
                  </div>
                </div>

                {adminMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(emailInput.trim() || ADMIN_PANEL_EMAIL)
                      setForgotError('')
                      setForgotOpen(true)
                    }}
                    className="text-xs text-muted-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-foreground"
                  >
                    ¿Contraseña olvidada?
                  </button>
                ) : null}

                {error ? <p className="text-xs text-destructive">{error}</p> : null}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleLogin()}
                  suppressHydrationWarning
                  className="flex w-full items-center justify-center gap-2 bg-foreground py-3 text-xs uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <LogIn className="h-4 w-4" strokeWidth={1.25} />
                  {submitting ? 'Entrando…' : adminMode ? 'Entrar al panel' : 'Iniciar sesión'}
                </button>

                {!adminMode ? (
                  <p className="text-center text-xs text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <Link
                      href="/registro"
                      onClick={() => setOpen(false)}
                      className="underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Crear cuenta
                    </Link>
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg tracking-wide">Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Introduce el correo de administración. Supabase te enviará un enlace para establecer una nueva contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Correo electrónico</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value)
                  setForgotError('')
                }}
                placeholder={ADMIN_PANEL_EMAIL}
                className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
                autoComplete="email"
              />
            </div>
            {forgotError ? <p className="text-xs text-destructive">{forgotError}</p> : null}
            <button
              type="button"
              disabled={forgotSubmitting}
              onClick={() => void handleForgotPassword()}
              className="w-full bg-foreground py-3 text-xs uppercase tracking-[0.2em] text-background hover:opacity-90 disabled:opacity-50"
            >
              {forgotSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
