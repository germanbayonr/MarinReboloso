'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'

export default function AjustesPage() {
  const [settings, setSettings] = useState({
    storeName: 'Wayfar Brand',
    storeEmail: 'wayfar.meri@gmail.com',
    storePhone: '+34 600 000 000',
    storeCity: 'Sevilla',
    currency: 'EUR',
    language: 'es',
    shippingCost: '4.95',
    freeShippingFrom: '80',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // Preparado para: supabase.from('settings').upsert(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-serif text-2xl tracking-wide">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configuración general de la tienda</p>
      </div>

      {/* General */}
      <div className="bg-white border border-border p-6 space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Información general</h2>
        {[
          { key: 'storeName', label: 'Nombre de la tienda' },
          { key: 'storeEmail', label: 'Email de contacto' },
          { key: 'storePhone', label: 'Teléfono' },
          { key: 'storeCity', label: 'Ciudad' },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</label>
            <input
              type="text"
              value={settings[key as keyof typeof settings]}
              onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Shipping */}
      <div className="bg-white border border-border p-6 space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Envíos y moneda</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Moneda</label>
            <select
              value={settings.currency}
              onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — Dólar</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Idioma</label>
            <select
              value={settings.language}
              onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Coste de envío (€)</label>
            <input
              type="number"
              value={settings.shippingCost}
              onChange={e => setSettings(prev => ({ ...prev, shippingCost: e.target.value }))}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Envío gratis desde (€)</label>
            <input
              type="number"
              value={settings.freeShippingFrom}
              onChange={e => setSettings(prev => ({ ...prev, freeShippingFrom: e.target.value }))}
              suppressHydrationWarning
              className="w-full px-3 py-2.5 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        suppressHydrationWarning
        className="flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors"
      >
        <Save className="w-4 h-4" strokeWidth={1.5} />
        {saved ? 'Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}
