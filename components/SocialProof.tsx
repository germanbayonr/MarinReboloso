'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, Play, Instagram, ChevronLeft, ChevronRight } from 'lucide-react'

const reviews = [
  {
    id: 1,
    text: 'El mantón es una auténtica joya artesanal. La caída de la seda y el detalle del enrejado son excepcionales. Superó todas mis expectativas para el evento.',
    author: 'Elena V.',
    rating: 5,
  },
  {
    id: 2,
    text: 'Los pendientes de la colección Filipa tienen un equilibrio perfecto entre peso y elegancia. No pesan nada y el baño en oro tiene un brillo muy sofisticado.',
    author: 'Beatriz S.',
    rating: 5,
  },
  {
    id: 3,
    text: 'Buscaba algo especial para una boda y el broche de coral fue el toque definitivo. La presentación del envío es puro lujo, se nota el cariño en cada detalle.',
    author: 'Sofía M.',
    rating: 5,
  },
]

const instagramPosts = [
  { id: 1, image: '/images/collection-isabelita.jpg', likes: 412, comments: 23, isVideo: false },
  { id: 2, image: '/images/collection-vintage.jpg', likes: 538, comments: 31, isVideo: true },
  { id: 3, image: '/images/collection-esencial.jpg', likes: 367, comments: 18, isVideo: false },
  { id: 4, image: '/images/collection-jaipur.jpg', likes: 621, comments: 42, isVideo: false },
  { id: 5, image: '/images/pendientes-jaipur-model.jpg', likes: 489, comments: 27, isVideo: true },
  { id: 6, image: '/images/manton-seda-negro-model.jpg', likes: 712, comments: 56, isVideo: false },
  { id: 7, image: '/images/pendientes-giralda-model.jpg', likes: 334, comments: 19, isVideo: false },
  { id: 8, image: '/images/choker-dorado-model.jpg', likes: 556, comments: 38, isVideo: false },
]

export default function SocialProof() {
  const [currentReview, setCurrentReview] = useState(0)

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length)
  }

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  return (
    <section className="bg-background py-16 md:py-24" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Customer Reviews Carousel */}
        <div className="mb-16 md:mb-24">
          <h2 className="font-serif text-2xl md:text-3xl text-center mb-8">Lo que dicen nuestras clientas</h2>
          <div className="max-w-3xl mx-auto relative">
            <div className="text-center py-8">
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(reviews[currentReview].rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 fill-accent"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              {/* Review Text */}
              <blockquote className="font-serif text-lg md:text-xl italic text-foreground mb-4 leading-relaxed">
                "{reviews[currentReview].text}"
              </blockquote>
              <p className="text-sm text-muted-foreground">— {reviews[currentReview].author}</p>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevReview}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 hover:text-accent transition-colors"
              aria-label="Anterior reseña"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 hover:text-accent transition-colors"
              aria-label="Siguiente reseña"
              suppressHydrationWarning
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReview(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentReview ? 'bg-accent' : 'bg-border'
                  }`}
                  aria-label={`Ir a reseña ${index + 1}`}
                  suppressHydrationWarning
                />
              ))}
            </div>
          </div>
        </div>

        {/* Instagram Feed */}
        <div>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Instagram className="w-6 h-6 text-foreground" />
              <h2 className="font-serif text-2xl md:text-3xl">@wayfarbrand</h2>
            </div>
            <p className="text-sm text-muted-foreground">Sevilla · Calle Rosario, 16</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-8">
            {instagramPosts.map((post) => (
              <InstagramPost key={post.id} post={post} />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="px-8 py-3 bg-[#E5D0B1] text-foreground text-sm uppercase tracking-wider hover:bg-[#D4BFA0] transition-colors"
              suppressHydrationWarning
            >
              Ver más
            </button>
            <a
              href="https://instagram.com/wayfarbrand"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2"
              suppressHydrationWarning
            >
              <Instagram className="w-4 h-4" />
              Follow on Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function InstagramPost({ post }: { post: typeof instagramPosts[0] }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative aspect-square overflow-hidden bg-secondary/20 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={post.image}
        alt="Instagram post"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 25vw"
      />

      {/* Video Play Icon (when not hovered) */}
      {post.isVideo && !isHovered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3">
            <Play className="w-6 h-6 text-foreground fill-foreground" />
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity">
          <div className="flex items-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 fill-white" />
              <span className="font-semibold">{post.likes}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 fill-white" />
              <span className="font-semibold">{post.comments}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
