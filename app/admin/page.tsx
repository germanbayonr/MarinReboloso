'use client'

import { TrendingUp, ShoppingCart, Users, Package, ArrowUpRight, Clock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const MOCK_ORDERS = [
  { id: '#0041', customer: 'Elena García', product: 'Pendientes Pastora', amount: 80, status: 'entregado', date: '2025-02-20' },
  { id: '#0040', customer: 'María López', product: 'Pendientes Ecos de Coral', amount: 85, status: 'enviado', date: '2025-02-19' },
  { id: '#0039', customer: 'Carmen Ruiz', product: 'Pendientes Lágrima de Coral', amount: 65, status: 'pendiente', date: '2025-02-18' },
  { id: '#0038', customer: 'Ana Martínez', product: 'Pendientes Aura Coralina', amount: 75, status: 'entregado', date: '2025-02-17' },
  { id: '#0037', customer: 'Isabel Sánchez', product: 'Pendientes Pastora', amount: 80, status: 'enviado', date: '2025-02-16' },
]

const STATUS_STYLES: Record<string, string> = {
  entregado: 'bg-green-50 text-green-700',
  enviado: 'bg-blue-50 text-blue-700',
  pendiente: 'bg-amber-50 text-amber-700',
}

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<
    Array<{
      id: string
      name: string
      price: number | string
      image_url: string | null
      category: string | null
      stripe_price_id: string | null
    }>
  >([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,image_url,category,stripe_price_id')
        .order('name', { ascending: true })
        .limit(5000)
      if (cancelled) return
      if (error) {
        setProducts([])
        return
      }
      setProducts((data ?? []).map((p: any) => ({
        id: String(p.id),
        name: String(p.name ?? ''),
        price: p.price,
        image_url: p.image_url ?? null,
        category: p.category ?? null,
        stripe_price_id: p.stripe_price_id ? String(p.stripe_price_id) : null,
      })))
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const syncedCount = useMemo(() => products.filter((p) => !!p.stripe_price_id).length, [products])

  const STATS = [
    { label: 'Ingresos este mes', value: '1.240€', change: '+12%', icon: TrendingUp },
    { label: 'Pedidos totales', value: '41', change: '+5 esta semana', icon: ShoppingCart },
    { label: 'Clientes', value: '38', change: '+3 nuevos', icon: Users },
    { label: 'Productos', value: String(products.length), change: `${syncedCount} con Stripe`, icon: Package },
  ]

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-2xl tracking-wide text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen general de tu tienda</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, value, change, icon: Icon }) => (
          <div key={label} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-serif text-2xl text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                {change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="xl:col-span-2 bg-white border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium tracking-wide uppercase">Últimos pedidos</h2>
            <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">Pedido</th>
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">Cliente</th>
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal hidden md:table-cell">Producto</th>
                  <th className="text-right text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">Importe</th>
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ORDERS.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{order.id}</td>
                    <td className="px-5 py-3.5 text-sm">{order.customer}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{order.product}</td>
                    <td className="px-5 py-3.5 text-sm text-right font-medium">{order.amount}€</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products at a glance */}
        <div className="bg-white border border-border">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium tracking-wide uppercase">Productos</h2>
          </div>
          <div className="divide-y divide-border">
            {products.slice(0, 5).map(product => (
              <div key={product.id} className="flex items-center gap-3 px-5 py-3.5">
                {product.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-10 h-10 object-cover flex-shrink-0 bg-secondary"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.price}€ · {product.category ?? '—'}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${
                    product.stripe_price_id ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {product.stripe_price_id ? 'Stripe OK' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
