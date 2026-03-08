export default function ClientesPage() {
  const CLIENTS = [
    { id: 1, name: 'Elena García', email: 'elena@mail.com', orders: 3, total: 225, joined: '2024-11-05' },
    { id: 2, name: 'María López', email: 'maria@mail.com', orders: 2, total: 150, joined: '2024-12-10' },
    { id: 3, name: 'Carmen Ruiz', email: 'carmen@mail.com', orders: 1, total: 65, joined: '2025-01-18' },
    { id: 4, name: 'Ana Martínez', email: 'ana@mail.com', orders: 4, total: 310, joined: '2024-10-22' },
    { id: 5, name: 'Isabel Sánchez', email: 'isabel@mail.com', orders: 2, total: 160, joined: '2025-02-01' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl tracking-wide">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{CLIENTS.length} clientes registrados</p>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Cliente', 'Email', 'Pedidos', 'Total gastado', 'Miembro desde'].map(h => (
                  <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map(client => (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-foreground/10 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.email}</td>
                  <td className="px-5 py-3.5 text-sm">{client.orders}</td>
                  <td className="px-5 py-3.5 text-sm font-medium">{client.total}€</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
