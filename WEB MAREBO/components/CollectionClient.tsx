'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Mock products organized by collection
const collectionProducts = {
  'isabelita': [
    { id: 1, name: 'Pendientes Giralda Oro', category: 'Pendientes', price: 25, image: '/images/pendientes-giralda.jpg', hoverImage: '/images/pendientes-giralda-model.jpg' },
    { id: 6, name: 'Mantón Bordado Crema', category: 'Mantones', price: 280, image: '/images/manton-seda-negro.jpg', hoverImage: '/images/manton-seda-negro-model.jpg' },
    { id: 8, name: 'Vestido Invitada', category: 'Trajes', price: 150, image: '/images/vestido-invitada.jpg', hoverImage: '/images/vestido-invitada-model.jpg' },
  ],
  'vintage': [
    { id: 3, name: 'Aros Plata Vintage', category: 'Pendientes', price: 22, image: '/images/pendientes-giralda.jpg', hoverImage: '/images/pendientes-giralda-model.jpg' },
  ],
  'esencial': [
    { id: 4, name: 'Pendientes Esmeralda', category: 'Pendientes', price: 35, image: '/images/pendientes-jaipur.jpg', hoverImage: '/images/pendientes-jaipur-model.jpg' },
    { id: 5, name: 'Mantón Seda Negro', category: 'Mantones', price: 250, image: '/images/manton-seda-negro.jpg', hoverImage: '/images/manton-seda-negro-model.jpg' },
    { id: 7, name: 'Traje Lino Beige', category: 'Trajes', price: 180, image: '/images/traje-lino-beige.jpg', hoverImage: '/images/traje-lino-beige-model.jpg' },
    { id: 9, name: 'Choker Dorado', category: 'Accesorios', price: 18, image: '/images/choker-dorado.jpg', hoverImage: '/images/choker-dorado-model.jpg' },
  ],
  'lost-in-jaipur': [
    { id: 2, name: 'Pendientes Lost in Jaipur', category: 'Pendientes', price: 30, image: '/images/pendientes-jaipur.jpg', hoverImage: '/images/pendientes-jaipur-model.jpg' },
  ],
}

interface CollectionClientProps {
  collectionSlug: string
  title: string
  description: string
}

export default function CollectionClient({ collectionSlug, title, description }: CollectionClientProps) {
  const products = collectionProducts[collectionSlug as keyof typeof collectionProducts] || []

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center">
          <h1 className="font-serif text-4xl md:text-5xl tracking-wide mb-4">{title}</h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Próximamente nuevos productos en esta colección.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: any }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={`/producto/${product.id}`} className="group">
      <div
        className="relative aspect-[3/4] overflow-hidden bg-secondary/20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-opacity duration-500"
          style={{ opacity: isHovered ? 0 : 1 }}
        />
        <Image
          src={product.hoverImage}
          alt={`${product.name} - modelo`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-opacity duration-500"
          style={{ opacity: isHovered ? 1 : 0 }}
        />
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <h3 className="font-serif text-sm text-foreground">{product.name}</h3>
        <p className="text-sm text-foreground">{product.price}€</p>
      </div>
    </Link>
  )
}
