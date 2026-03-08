export default function PedidosPage() {
  const ORDERS = [
    { id: '#0041', customer: 'Elena García', email: 'elena@mail.com', product: 'Pendientes Pastora', amount: 80, status: 'entregado', date: '2025-02-20' },
    { id: '#0040', customer: 'María López', email: 'maria@mail.com', product: 'Pendientes Ecos de Coral', amount: 85, status: 'enviado', date: '2025-02-19' },
    { id: '#0039', customer: 'Carmen Ruiz', email: 'carmen@mail.com', product: 'Pendientes Lágrima de Coral', amount: 65, status: 'pendiente', date: '2025-02-18' },
    { id: '#0038', customer: 'Ana Martínez', email: 'ana@mail.com', product: 'Pendientes Aura Coralina', amount: 75, status: 'entregado', date: '2025-02-17' },
    { id: '#0037', customer: 'Isabel Sánchez', email: 'isabel@mail.com', product: 'Pendientes Pastora', amount: 80, status: 'enviado', date: '2025-02-16' },
  ]

  const STATUS_STYLES: Record<string, string> = {
    entregado: 'bg-green-50 text-green-700',
    enviado: 'bg-blue-50 text-blue-700',
    pendiente: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl tracking-wide">Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{ORDERS.length} pedidos registrados</p>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Pedido', 'Cliente', 'Producto', 'Importe', 'Fecha', 'Estado'].map(h => (
                  <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDERS.map(order => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{order.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.product}</td>
                  <td className="px-5 py-3.5 text-sm font-medium">{order.amount}€</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
