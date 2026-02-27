import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProductListingClient from '@/components/ProductListingClient'

// Define categorías válidas
const validCategories = [
  'pendientes',
  'mantones',
  'trajes',
  'accesorios',
  'cinturones',
  'chokers',
  'peinecillos',
]

// Metadata for SEO
export async function generateMetadata({ params }: { params: { categoria: string } }) {
  const categoria = params.categoria
  
  if (!validCategories.includes(categoria)) {
    return {
      title: 'Categoría no encontrada | Wayfar Brand',
    }
  }

  const categoryTitles: Record<string, string> = {
    pendientes: 'Pendientes',
    mantones: 'Mantones',
    trajes: 'Trajes',
    accesorios: 'Accesorios',
    cinturones: 'Cinturones',
    chokers: 'Chokers',
    peinecillos: 'Peinecillos',
  }

  return {
    title: `${categoryTitles[categoria]} | Wayfar Brand`,
    description: `Descubre nuestra colección de ${categoryTitles[categoria].toLowerCase()} artesanales de lujo con estilo andaluz.`,
  }
}

export default function ProductCategoryPage({ params }: { params: { categoria: string } }) {
  const categoria = params.categoria

  // Validar categoría
  if (!validCategories.includes(categoria)) {
    notFound()
  }

  // Títulos de categorías
  const categoryTitles: Record<string, string> = {
    pendientes: 'Pendientes',
    mantones: 'Mantones',
    trajes: 'Trajes',
    accesorios: 'Accesorios',
    cinturones: 'Cinturones',
    chokers: 'Chokers',
    peinecillos: 'Peinecillos',
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen" suppressHydrationWarning>
        <ProductListingClient 
          categoria={categoria}
          title={categoryTitles[categoria]}
        />
      </main>
    </>
  )
}

// Generate static params for all categories
export function generateStaticParams() {
  return validCategories.map((categoria) => ({
    categoria,
  }))
}
