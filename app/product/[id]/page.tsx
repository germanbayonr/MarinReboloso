import Navbar from '@/components/Navbar'

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 md:pt-24 pb-16 px-4 md:px-10">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="font-serif text-3xl md:text-4xl mb-4">Página de producto</h1>
          <p className="text-muted-foreground">Vista de producto próximamente</p>
        </div>
      </div>
    </main>
  )
}
