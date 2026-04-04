'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type CustomerRow = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  shipping_address: string | null
}

const field =
  'w-full border-0 border-b border-foreground/15 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none focus:ring-0 transition-colors'

export default function MiCuentaPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    shipping_address: '',
  })

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase.from('customers').select('*').eq('id', user.id).maybeSingle()
    if (error) {
      toast.error('No se pudo cargar tu perfil')
      setLoading(false)
      return
    }
    const row = data as CustomerRow | null
    if (row) {
      setForm({
        first_name: row.first_name ?? '',
        last_name: row.last_name ?? '',
        phone: row.phone ?? '',
        shipping_address: row.shipping_address ?? '',
      })
    } else {
      setForm({
        first_name: (user.user_metadata?.first_name as string) || '',
        last_name: (user.user_metadata?.last_name as string) || '',
        phone: (user.user_metadata?.phone as string) || '',
        shipping_address: (user.user_metadata?.shipping_address as string) || '',
      })
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    void load()
  }, [authLoading, user, load])

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
    }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.from('customers').upsert(
        {
          id: user.id,
          email: user.email ?? null,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim() || null,
          shipping_address: form.shipping_address.trim() || null,
        },
        { onConflict: 'id' },
      )
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Perfil actualizado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7]" suppressHydrationWarning>
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-28 md:pt-36">
        <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Cuenta</p>
        <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">Mi cuenta</h1>
        {user?.email ? (
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        ) : null}

        {authLoading || loading ? (
          <p className="mt-16 font-serif text-sm tracking-wide text-muted-foreground">Cargando tu perfil…</p>
        ) : (
          <>
            <form onSubmit={handleSave} className="mt-12 space-y-8">
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
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Teléfono</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className={field} suppressHydrationWarning />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Dirección de envío (opcional)
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

              <button
                type="submit"
                disabled={saving}
                className="bg-foreground px-10 py-3 text-[10px] uppercase tracking-[0.25em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                suppressHydrationWarning
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>

            <section className="mt-20 border-t border-foreground/10 pt-12">
              <h2 className="font-serif text-xl tracking-tight text-foreground">Historial de pedidos</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Aquí aparecerán tus compras cuando activemos el seguimiento de pedidos en el marketplace.
              </p>
              <div className="mt-8 flex flex-col gap-3 rounded-sm bg-white/60 p-8 text-center ring-1 ring-foreground/6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sin pedidos todavía</p>
                <Link
                  href="/catalogo"
                  className="mx-auto mt-2 inline-flex border border-foreground px-8 py-3 text-[10px] uppercase tracking-[0.25em] transition-colors hover:bg-foreground hover:text-background"
                  suppressHydrationWarning
                >
                  Explorar piezas
                </Link>
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </main>
  )
}
