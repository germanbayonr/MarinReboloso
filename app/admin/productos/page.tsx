'use client'

import Link from 'next/link'
import { useProducts, Product } from '@/lib/products-context'
import { PlusCircle, Pencil, Trash2, Search, X, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const CATEGORIES = ['pendientes', 'mantones', 'trajes', 'accesorios', 'cinturones', 'chokers', 'peinecillos']
const COLLECTIONS = ['Descará', 'Isabelita', 'Vintage', 'Esencial', 'Lost in Jaipur']

function EditModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { updateProduct } = useProducts()
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    sku: product.sku,
    stock: String(product.stock),
    status: product.status,
    category: product.category,
    collection: product.collection,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateProduct(product.id, {
      name: form.name,
      price: Number(form.price),
      sku: form.sku,
      stock: Number(form.stock),
      status: form.status,
      category: form.category,
      collection: form.collection,
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
              <label className="text-xs text-muted-foreground uppercase tracking-wider">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                suppressHydrationWarning
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                suppressHydrationWarning
                min="0"
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Estado</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'published' | 'draft' }))}
                suppressHydrationWarning
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
              >
                <option value="published">Publicado</option>
                <option value="draft">Borrador</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Colección</label>
              <select
                value={form.collection}
                onChange={e => setForm(f => ({ ...f, collection: e.target.value }))}
                suppressHydrationWarning
                className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
              >
                {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
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
  const { products, deleteProduct, updateProduct } = useProducts()
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {editingProduct && (
        <EditModal product={editingProduct} onClose={() => setEditingProduct(null)} />
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
          placeholder="Buscar por nombre o SKU..."
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
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal hidden md:table-cell">SKU</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal hidden lg:table-cell">Colección</th>
                <th className="text-right text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">Precio</th>
                <th className="text-right text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">Stock</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">Estado</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt={product.name} className="w-9 h-9 object-cover flex-shrink-0 bg-secondary" />
                      ) : (
                        <div className="w-9 h-9 bg-secondary flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground hidden md:table-cell">{product.sku}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">{product.collection}</td>
                  <td className="px-5 py-3.5 text-sm text-right font-medium">{product.price}€</td>
                  <td className="px-5 py-3.5 text-sm text-right">
                    <span className={cn(product.stock < 5 ? 'text-amber-600' : 'text-foreground')}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => updateProduct(product.id, { status: product.status === 'published' ? 'draft' : 'published' })}
                      suppressHydrationWarning
                      className={cn(
                        'text-xs px-2 py-0.5 transition-colors cursor-pointer',
                        product.status === 'published'
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      )}
                    >
                      {product.status === 'published' ? 'Activo' : 'Borrador'}
                    </button>
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
                        onClick={() => deleteProduct(product.id)}
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
