import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import CollectionClient from '@/components/CollectionClient'

const validCollections = ['isabelita', 'vintage', 'esencial', 'lost-in-jaipur']

const collectionData = {
  'isabelita': {
    title: 'Isabelita',
    description: 'Elegancia clásica con un toque moderno. La colección Isabelita rinde homenaje a la tradición andaluza.',
  },
  'vintage': {
    title: 'Vintage',
    description: 'Piezas atemporales inspiradas en el archivo histórico de la moda flamenca.',
  },
  'esencial': {
    title: 'Esencial',
    description: 'Lo fundamental reinventado. Diseños minimalistas para el día a día con alma andaluza.',
  },
  'lost-in-jaipur': {
    title: 'Lost in Jaipur',
    description: 'Un viaje entre dos culturas. Fusión de la artesanía andaluza con la riqueza de la India.',
  },
}

export async function generateMetadata({ params }: { params: { nombre: string } }) {
  const collection = params.nombre
  
  if (!validCollections.includes(collection)) {
    return {
      title: 'Colección no encontrada | Wayfar Brand',
    }
  }

  const data = collectionData[collection as keyof typeof collectionData]

  return {
    title: `${data.title} | Wayfar Brand`,
    description: data.description,
  }
}

export default function CollectionPage({ params }: { params: { nombre: string } }) {
  const collection = params.nombre

  if (!validCollections.includes(collection)) {
    notFound()
  }

  const data = collectionData[collection as keyof typeof collectionData]

  return (
    <>
      <Navbar />
      <main className="min-h-screen" suppressHydrationWarning>
        <CollectionClient 
          collectionSlug={collection}
          title={data.title}
          description={data.description}
        />
      </main>
    </>
  )
}

export function generateStaticParams() {
  return validCollections.map((nombre) => ({
    nombre,
  }))
}
