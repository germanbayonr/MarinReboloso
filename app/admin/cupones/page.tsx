'use client'

import { useState } from 'react'
import { Tag, Plus, Trash2 } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  type: 'porcentaje' | 'fijo'
  value: number
  uses: number
  active: boolean
}

const INITIAL_COUPONS: Coupon[] = [
  { id: '1', code: 'FERIA25', type: 'porcentaje', value: 25, uses: 12, active: true },
  { id: '2', code: 'BIENVENIDA10', type: 'fijo', value: 10, uses: 5, active: true },
  { id: '3', code: 'VERANO15', type: 'porcentaje', value: 15, uses: 0, active: false },
]

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS)
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState<'porcentaje' | 'fijo'>('porcentaje')
  const [newValue, setNewValue] = useState('')
  const [adding, setAdding] = useState(false)

  const addCoupon = () => {
    if (!newCode.trim() || !newValue) return
    setCoupons(prev => [...prev, {
      id: crypto.randomUUID(),
      code: newCode.toUpperCase(),
      type: newType,
      value: Number(newValue),
      uses: 0,
      active: true,
    }])
    setNewCode('')
    setNewValue('')
    setAdding(false)
  }

  const toggle = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
  }

  const remove = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-wide">Cupones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{coupons.length} cupones creados</p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          suppressHydrationWarning
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nuevo cupón
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white border border-border p-5 flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Código</label>
            <input
              type="text"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="FERIA25"
              suppressHydrationWarning
              className="px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as 'porcentaje' | 'fijo')}
              suppressHydrationWarning
              className="px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Importe fijo (€)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Valor</label>
            <input
              type="number"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder={newType === 'porcentaje' ? '25' : '10'}
              suppressHydrationWarning
              min="0"
              className="w-24 px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <button
            onClick={addCoupon}
            suppressHydrationWarning
            className="bg-foreground text-background px-5 py-2.5 text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors"
          >
            Crear
          </button>
        </div>
      )}

      {/* Coupons list */}
      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Código', 'Descuento', 'Usos', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-mono text-sm font-medium">{c.code}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm">
                  {c.type === 'porcentaje' ? `${c.value}%` : `${c.value}€`}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.uses} usos</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => toggle(c.id)}
                    suppressHydrationWarning
                    className={`text-xs px-2 py-0.5 cursor-pointer transition-colors ${c.active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {c.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => remove(c.id)}
                    suppressHydrationWarning
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
