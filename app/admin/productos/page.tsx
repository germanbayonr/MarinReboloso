'use client'

import Link from 'next/link'
import { PlusCircle, Pencil, Trash2, Search, X, CheckCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['pendientes', 'mantones', 'accesorios', 'peinecillos', 'broches', 'pulseras', 'collares', 'bolsos']

type ProductRow = {
  id: string
  name: string
  price: number
  category: string | null
  image_url: string | null
  is_new_arrival: boolean
  stripe_price_id: string | null
}

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function EditModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductRow
  onClose: () => void
  onSaved: (next: ProductRow) => void
}) {
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    category: product.category ?? 'accesorios',
    image_url: product.image_url ?? '',
    is_new_arrival: product.is_new_arrival,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const payload = {
      name: form.name,
      price: Number(form.price),
      category: form.category,
      image_url: form.image_url,
      is_new_arrival: form.is_new_arrival,
    }

    const { data, error } = await supabase.from('products').update(payload).eq('id', product.id).select('id').maybeSingle()
    if (error || !data?.id) return

    onSaved({
      ...product,
      name: payload.name,
      price: payload.price,
      category: payload.category,
      image_url: payload.image_url,
      is_new_arrival: payload.is_new_arrival,
    })
    setSaved(true)
    setTimeout(onClose, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white border border-border w-full max-w-lg mx-4 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-serif text-lg tracking-wide">Editar producto</h2>
          <button onClick={onClose} suppressHydrationWarning className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Precio (€)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                suppressHydrationWarning
                min="0"
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Categoría</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                suppressHydrationWarning
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Imagen (URL)</label>
            <input
              type="url"
              value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_new_arrival}
              onChange={(e) => setForm(f => ({ ...f, is_new_arrival: e.target.checked }))}
              className="w-3.5 h-3.5 accent-foreground"
              suppressHydrationWarning
            />
            <span className="text-sm text-muted-foreground">Marcar como novedad</span>
          </label>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          {saved ? (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              Guardado
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              suppressHydrationWarning
              className="px-4 py-2 text-sm border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              suppressHydrationWarning
              className="px-4 py-2 text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors uppercase tracking-wider"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductosPage() {
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,category,image_url,is_new_arrival,stripe_price_id')
        .order('name', { ascending: true })
        .limit(5000)

      if (cancelled) return
      if (error) {
        setProducts([])
        return
      }

      setProducts(
        (data ?? []).map((p: any) => ({
          id: String(p.id),
          name: String(p.name ?? ''),
          price: toNumber(p.price),
          category: p.category ?? null,
          image_url: p.image_url ?? null,
          is_new_arrival: Boolean(p.is_new_arrival),
          stripe_price_id: p.stripe_price_id ? String(p.stripe_price_id) : null,
        })),
      )
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q),
    )
  }, [products, search])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-5">
      {editingProduct && (
        <EditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={(next) => setProducts((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-wide">Productos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} productos en total</p>
        </div>
        <Link
          href="/admin/nuevo-producto"
          suppressHydrationWarning
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors"
        >
          <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
          Nuevo producto
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          suppressHydrationWarning
          className="w-full max-w-sm pl-9 pr-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">Producto</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal hidden md:table-cell">Categoría</th>
                <th className="text-right text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">Precio</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">Stripe</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.name} className="w-9 h-9 object-cover flex-shrink-0 bg-secondary" />
                      ) : (
                        <div className="w-9 h-9 bg-secondary flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{product.category ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-right font-medium">{product.price}€</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 transition-colors',
                        product.stripe_price_id ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {product.stripe_price_id ? 'OK' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        suppressHydrationWarning
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Editar producto"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        suppressHydrationWarning
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
