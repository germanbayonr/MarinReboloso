'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { sendWelcomeEmailAction } from '@/app/actions/marebo-mail'

const field =
  'w-full border-0 border-b border-foreground/15 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none focus:ring-0 transition-colors'

const fieldNoBorder =
  'min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0'

export default function RegistroPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    shipping_address: '',
    email: '',
    password: '',
  })

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    if (!form.first_name.trim()) {
      toast.error('Indica tu nombre')
      return
    }
    if (!form.last_name.trim()) {
      toast.error('Indica tus apellidos')
      return
    }
    if (!form.email.trim() || !form.password) {
      toast.error('Email y contraseña son obligatorios')
      return
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    const first_name = form.first_name.trim()
    const last_name = form.last_name.trim()
    const phone = form.phone.trim()
    const shipping_address = form.shipping_address.trim()

    setSubmitting(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: origin ? `${origin}/mi-cuenta` : undefined,
          data: {
            first_name,
            last_name,
            phone,
            shipping_address,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      const uid = data.user?.id
      if (uid && data.session) {
        const { error: rowError } = await supabase.from('customers').upsert(
          {
            id: uid,
            email: form.email.trim(),
            first_name,
            last_name,
            phone: phone || null,
            shipping_address: shipping_address || null,
          },
          { onConflict: 'id' },
        )
        if (rowError) {
          toast.error('Cuenta creada; no se pudo guardar el perfil. Completa los datos en Mi cuenta.')
        }
      }

      if (data.session) {
        void sendWelcomeEmailAction(form.email.trim())
        toast.success('Cuenta creada. Ya puedes explorar la tienda.')
        router.push('/mi-cuenta')
        router.refresh()
      } else {
        toast.message('Revisa tu correo para confirmar la cuenta y acceder a tu perfil.')
        router.push('/')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7]" suppressHydrationWarning>
      <Navbar />

      <div className="mx-auto max-w-lg px-6 pb-24 pt-28 md:pt-36">
        <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Nueva cuenta</p>
        <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">Crear cuenta</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Un perfil elegante para tu experiencia en Marebo. Tus datos se guardan de forma segura.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-8">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nombre</label>
            <input
              type="text"
              value={form.first_name}
              onChange={set('first_name')}
              className={field}
              autoComplete="given-name"
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Apellidos</label>
            <input
              type="text"
              value={form.last_name}
              onChange={set('last_name')}
              className={field}
              autoComplete="family-name"
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Teléfono (Opcional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="Opcional"
              className={field}
              autoComplete="tel"
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Dirección de Envío (Opcional)
            </label>
            <textarea
              rows={3}
              value={form.shipping_address}
              onChange={set('shipping_address')}
              placeholder="Opcional"
              className={`${field} resize-none`}
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              className={field}
              autoComplete="email"
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contraseña</label>
            <div className="flex items-stretch gap-2 border-b border-foreground/15 pb-px focus-within:border-foreground/40">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                className={fieldNoBorder}
                autoComplete="new-password"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="flex h-[46px] w-11 shrink-0 items-center justify-center rounded-sm border border-foreground/20 text-foreground/70 transition-colors hover:border-foreground/40 hover:bg-foreground/[0.04] hover:text-foreground"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                suppressHydrationWarning
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground py-4 text-[10px] uppercase tracking-[0.25em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            suppressHydrationWarning
          >
            {submitting ? 'Creando…' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/" className="underline decoration-foreground/25 underline-offset-4 hover:text-foreground">
            Volver a la tienda e iniciar sesión
          </Link>
        </p>
      </div>

      <Footer />
    </main>
  )
}
