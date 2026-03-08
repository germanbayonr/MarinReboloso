export default function ColeccionesPage() {
  const COLLECTIONS = [
    { name: 'Isabelita', products: 2, status: 'activa', season: 'Primavera 2025' },
    { name: 'Vintage', products: 1, status: 'activa', season: 'Todo el año' },
    { name: 'Esencial', products: 1, status: 'activa', season: 'Todo el año' },
    { name: 'Lost in Jaipur', products: 1, status: 'activa', season: 'Verano 2025' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl tracking-wide">Colecciones</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{COLLECTIONS.length} colecciones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLLECTIONS.map(col => (
          <div key={col.name} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="font-serif text-base">{col.name}</h2>
              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5">{col.status}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{col.season}</p>
              <p className="text-sm">{col.products} productos</p>
            </div>
            <button suppressHydrationWarning className="text-xs underline text-muted-foreground hover:text-foreground transition-colors">
              Ver productos
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
