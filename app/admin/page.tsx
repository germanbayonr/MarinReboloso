'use client'

import Image from 'next/image'
import { TrendingUp, ShoppingCart, Users, Package, ArrowUpRight, Clock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { sendTestEmail, simulateRealPurchase } from '@/app/admin/actions'
import { supabase } from '@/lib/supabase'

function ProductThumb({ imageUrl, name }: { imageUrl: string | null | undefined; name: string }) {
  const src = typeof imageUrl === 'string' ? imageUrl.trim() : ''
  if (!src) {
    return <div className="h-10 w-10 flex-shrink-0 bg-neutral-100" aria-hidden />
  }
  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      unoptimized
      className="h-10 w-10 flex-shrink-0 bg-secondary object-cover"
    />
  )
}

function firstItemLabel(items_json: unknown): string {
  if (!items_json || !Array.isArray(items_json) || items_json.length === 0) return ''
  const first = items_json[0]
  if (!first || typeof first !== 'object') return ''
  const o = first as Record<string, unknown>
  const name = o.name ?? o.product_name ?? o.title
  return typeof name === 'string' ? name : ''
}

function shortOrderId(id: string): string {
  return String(id).slice(0, 5).toUpperCase()
}

function formatOrderDate(iso: string | null | undefined): string {
  if (!iso || typeof iso !== 'string') return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

type DashboardOrderRow = {
  key: string
  ref: string
  customer: string
  product: string
  amountLabel: string
  status: string
  dateLabel: string
}

const STATUS_STYLES: Record<string, string> = {
  entregado: 'bg-green-50 text-green-700',
  enviado: 'bg-blue-50 text-blue-700',
  pendiente: 'bg-amber-50 text-amber-700',
  preparando: 'bg-violet-50 text-violet-700',
  cancelado: 'bg-neutral-100 text-neutral-600',
  reembolsado: 'bg-orange-50 text-orange-800',
  paid: 'bg-emerald-50 text-emerald-800',
}

function statusClass(status: string) {
  return STATUS_STYLES[status] ?? 'bg-secondary text-muted-foreground'
}

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  const [simulateLoading, setSimulateLoading] = useState(false)
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)
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
  const [orders, setOrders] = useState<DashboardOrderRow[]>([])
  const [orderTotalCount, setOrderTotalCount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const [productsRes, ordersRes, countRes] = await Promise.all([
        supabase
          .from('products')
          .select('id,name,price,image_url,category,stripe_price_id')
          .order('name', { ascending: true })
          .limit(5000),
        supabase
          .from('orders')
          .select('id,created_at,customer_email,customer_name,line_summary,items_json,total_amount,status')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ])

      if (cancelled) return

      if (productsRes.error) {
        setProducts([])
      } else {
        const rows = Array.isArray(productsRes.data) ? productsRes.data : []
        setProducts(
          rows.map((p: Record<string, unknown>) => {
            const raw = p.price
            const price =
              typeof raw === 'number'
                ? raw
                : typeof raw === 'string'
                  ? raw
                  : Number(raw) || 0
            return {
              id: String(p.id),
              name: String(p.name ?? ''),
              price,
              image_url: p.image_url != null && String(p.image_url).trim() ? String(p.image_url).trim() : null,
              category: p.category != null ? String(p.category) : null,
              stripe_price_id: p.stripe_price_id ? String(p.stripe_price_id) : null,
            }
          }),
        )
      }

      if (ordersRes.error) {
        setOrders([])
      } else {
        const raw = Array.isArray(ordersRes.data) ? ordersRes.data : []
        const mapped: DashboardOrderRow[] = raw.map((row: Record<string, unknown>) => {
          const id = String(row.id ?? '')
          const lineSummary = row.line_summary != null ? String(row.line_summary).trim() : ''
          const fromJson = firstItemLabel(row.items_json)
          const product = lineSummary || fromJson || 'Sin detalle de producto'
          const totalAmt = row.total_amount
          const amountNum =
            typeof totalAmt === 'number' && Number.isFinite(totalAmt) ? totalAmt : null
          const amountLabel =
            amountNum != null
              ? new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(amountNum)
              : '—'
          const name =
            row.customer_name != null && String(row.customer_name).trim()
              ? String(row.customer_name).trim()
              : null
          const email =
            row.customer_email != null && String(row.customer_email).trim()
              ? String(row.customer_email).trim()
              : null
          const customer =
            name && email ? `${name} · ${email}` : name ?? email ?? 'Cliente desconocido'
          return {
            key: id || Math.random().toString(36),
            ref: id ? shortOrderId(id) : '—',
            customer,
            product,
            amountLabel,
            status: String(row.status ?? ''),
            dateLabel: formatOrderDate(row.created_at != null ? String(row.created_at) : null),
          }
        })
        setOrders(mapped)
      }

      if (!countRes.error && typeof countRes.count === 'number') {
        setOrderTotalCount(countRes.count)
      } else {
        setOrderTotalCount(Array.isArray(ordersRes.data) ? ordersRes.data.length : 0)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [dashboardRefreshKey])

  const syncedCount = useMemo(() => products.filter((p) => !!p.stripe_price_id).length, [products])

  const STATS = useMemo(
    () => [
      { label: 'Ingresos este mes', value: '1.240€', change: '+12%', icon: TrendingUp },
      { label: 'Pedidos totales', value: String(orderTotalCount), change: '+5 esta semana', icon: ShoppingCart },
      { label: 'Clientes', value: '38', change: '+3 nuevos', icon: Users },
      { label: 'Productos', value: String(products.length), change: `${syncedCount} con Stripe`, icon: Package },
    ],
    [orderTotalCount, products.length, syncedCount],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="order-first sm:order-last flex flex-shrink-0 flex-col gap-2 self-start sm:items-end">
          <button
            type="button"
            disabled={simulateLoading || testEmailLoading}
            suppressHydrationWarning
            onClick={async () => {
              setSimulateLoading(true)
              try {
                const res = await simulateRealPurchase()
                if (res.ok) {
                  toast.success('Compra simulada: pedido creado y correo enviado')
                  setDashboardRefreshKey((k) => k + 1)
                } else {
                  toast.error(res.error)
                }
              } finally {
                setSimulateLoading(false)
              }
            }}
            className="border border-foreground bg-white px-4 py-2.5 text-xs font-medium tracking-wide text-foreground hover:bg-secondary disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {mounted
              ? simulateLoading
                ? 'Simulando…'
                : 'Simular Compra Real'
              : 'Simular compra'}
          </button>
          <button
            type="button"
            disabled={testEmailLoading || simulateLoading}
            suppressHydrationWarning
            onClick={async () => {
              setTestEmailLoading(true)
              try {
                const res = await sendTestEmail()
                if (res.ok) {
                  toast.success('Correo enviado, revisa tu bandeja de entrada')
                  setDashboardRefreshKey((k) => k + 1)
                } else {
                  toast.error(res.error)
                }
              } finally {
                setTestEmailLoading(false)
              }
            }}
            className="border border-foreground bg-foreground px-4 py-2.5 text-xs font-medium tracking-wide text-background hover:bg-foreground/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {mounted ? (testEmailLoading ? 'Enviando…' : '🚀 Probar Envío de Email') : 'Probar envío de email'}
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl tracking-wide text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen general de tu tienda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, value, change, icon: Icon }) => (
          <div key={label} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-serif text-2xl text-foreground" suppressHydrationWarning>
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                {change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium tracking-wide uppercase">Últimos pedidos</h2>
            <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">
                    Pedido
                  </th>
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">
                    Cliente
                  </th>
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal hidden md:table-cell">
                    Producto
                  </th>
                  <th className="text-right text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">
                    Importe
                  </th>
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal hidden sm:table-cell">
                    Fecha
                  </th>
                  <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 font-normal">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No hay pedidos todavía.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.key}
                      className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{order.ref}</td>
                      <td className="px-5 py-3.5 text-sm">{order.customer}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">
                        {order.product}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right font-medium">{order.amountLabel}</td>
                      <td
                        className="px-5 py-3.5 text-xs text-muted-foreground hidden sm:table-cell"
                        suppressHydrationWarning
                      >
                        {order.dateLabel}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusClass(order.status)}`}
                        >
                          {order.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-border">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium tracking-wide uppercase">Productos</h2>
          </div>
          <div className="divide-y divide-border">
            {products.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No hay productos.</p>
            ) : (
              products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3.5">
                  <ProductThumb imageUrl={product.image_url} name={product.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.price}€ · {product.category ?? '—'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${
                      product.stripe_price_id ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {product.stripe_price_id ? 'Stripe OK' : 'Pendiente'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
