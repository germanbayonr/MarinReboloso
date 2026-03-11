'use client'

import { useState } from 'react'
import { User, Mail, Lock, ChevronDown, LogIn } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

export default function AdminAuthDropdown() {
  const { isAuthenticated, login, logout, email } = useAuth()
  const router = useRouter()
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (setOpen: (open: boolean) => void) => {
    const result = login(emailInput, passwordInput)
    if (result === 'admin') {
      setOpen(false)
      setError('')
      setEmailInput('')
      setPasswordInput('')
      router.push('/admin/productos')
    } else if (result === 'user') {
      setOpen(false)
      setError('')
    } else {
      setError('Correo o contraseña incorrectos.')
    }
  }

  const handleLogout = (setOpen: (open: boolean) => void) => {
    logout()
    setOpen(false)
    router.push('/')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          suppressHydrationWarning
          className="flex items-center gap-1.5 hover:opacity-60 transition-opacity outline-none"
          aria-label="Cuenta de usuario"
        >
          <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
          {isAuthenticated && (
            <ChevronDown className="w-3 h-3 transition-transform" strokeWidth={1.5} />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-72 bg-white text-gray-900 border border-gray-200 shadow-xl p-5">
        {/* Usamos un wrapper para pasar setOpen si es necesario, o manejamos el estado internamente si Radix lo permite */}
        {/* Para simplificar con Popover de Radix, usaremos el estado controlado si necesitamos cerrar manualmente */}
        <AuthContent 
          isAuthenticated={isAuthenticated}
          email={email}
          emailInput={emailInput}
          setEmailInput={setEmailInput}
          passwordInput={passwordInput}
          setPasswordInput={setPasswordInput}
          error={error}
          setError={setError}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          router={router}
        />
      </PopoverContent>
    </Popover>
  )
}

function AuthContent({ 
  isAuthenticated, email, emailInput, setEmailInput, 
  passwordInput, setPasswordInput, error, setError, 
  handleLogin, handleLogout, router 
}: any) {
  // Radix Popover no pasa setOpen fácilmente a los hijos sin Contexto, 
  // pero para este caso el contenido es estático o redirige.
  return (
    <div style={{ mixBlendMode: 'normal' }}>
      {isAuthenticated ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
              <User className="w-4 h-4 text-background" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Administrador</p>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{email}</p>
            </div>
          </div>
          <button
            onClick={() => { router.push('/admin/productos') }}
            suppressHydrationWarning
            className="w-full text-sm text-left text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Panel de administración
          </button>
          <button
            onClick={() => handleLogout(() => {})} // El Popover se cerrará por la navegación o clic fuera
            suppressHydrationWarning
            className="w-full text-sm text-left text-muted-foreground hover:text-destructive transition-colors py-1"
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-serif text-sm tracking-wide">Acceso</p>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="email"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setError('') }}
                placeholder="correo@ejemplo.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
                suppressHydrationWarning
                onKeyDown={e => e.key === 'Enter' && handleLogin(() => {})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="password"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setError('') }}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
                suppressHydrationWarning
                onKeyDown={e => e.key === 'Enter' && handleLogin(() => {})}
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            onClick={() => handleLogin(() => {})}
            suppressHydrationWarning
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 text-sm tracking-wider uppercase hover:bg-gray-700 transition-colors"
          >
            <LogIn className="w-4 h-4" strokeWidth={1.5} />
            Iniciar sesión
          </button>

          <p className="text-center text-xs text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <button suppressHydrationWarning className="underline hover:text-foreground transition-colors">
              Crear cuenta
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
