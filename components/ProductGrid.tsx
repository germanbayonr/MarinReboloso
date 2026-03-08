'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
  imageHover: string
  aspectRatio: 'square' | 'vertical'
}

const products: Product[] = [
  {
    id: 1,
    name: 'Traje Lino Beige',
    category: 'Trajes',
    price: 180,
    image: '/images/traje-lino-beige.jpg',
    imageHover: '/images/traje-lino-beige-model.jpg',
    aspectRatio: 'vertical',
  },
  {
    id: 2,
    name: 'Pendientes Giralda Oro',
    category: 'Pendientes',
    price: 25,
    image: '/images/pendientes-giralda.jpg',
    imageHover: '/images/pendientes-giralda-model.jpg',
    aspectRatio: 'square',
  },
  {
    id: 3,
    name: 'Mantón Seda Negro',
    category: 'Mantones',
    price: 250,
    image: '/images/manton-seda-negro.jpg',
    imageHover: '/images/manton-seda-negro-model.jpg',
    aspectRatio: 'vertical',
  },
  {
    id: 4,
    name: 'Choker Dorado',
    category: 'Accesorios',
    price: 18,
    image: '/images/choker-dorado.jpg',
    imageHover: '/images/choker-dorado-model.jpg',
    aspectRatio: 'square',
  },
  {
    id: 5,
    name: 'Pendientes Lost in Jaipur',
    category: 'Colección',
    price: 30,
    image: '/images/pendientes-jaipur.jpg',
    imageHover: '/images/pendientes-jaipur-model.jpg',
    aspectRatio: 'square',
  },
  {
    id: 6,
    name: 'Vestido Invitada',
    category: 'Trajes',
    price: 150,
    image: '/images/vestido-invitada.jpg',
    imageHover: '/images/vestido-invitada-model.jpg',
    aspectRatio: 'vertical',
  },
]

export default function ProductGrid() {
  return (
    <section className="px-4 md:px-8 py-16 md:py-24">
      <div className="columns-2 md:columns-4 gap-4 space-y-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="break-inside-avoid mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-3">
        {/* Product Image */}
        <div className="relative w-full overflow-hidden bg-secondary">
          <div
            className={
              product.aspectRatio === 'square'
                ? 'aspect-square'
                : 'aspect-[3/4]'
            }
          >
            <Image
              src={isHovered ? product.imageHover : product.image}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {product.category}
          </p>
          <h3 className="font-serif text-base">{product.name}</h3>
          <p className="font-sans text-sm">{product.price}€</p>
        </div>

        {/* Add Button */}
        <button className="w-full border border-border py-2 text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" suppressHydrationWarning>
          Añadir
        </button>
      </div>
    </div>
  )
}
