'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Instagram, ChevronLeft, ChevronRight } from 'lucide-react'

const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/marebo_jewelry/'

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

const INSTAGRAM_POSTS = [
  { id: 1, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Insta1.png', isVideo: false },
  { id: 2, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Insta2.png', isVideo: false },
  { id: 3, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/WhatsApp%20Image%202026-03-11%20at%2006.55.57.jpeg', isVideo: false },
  { id: 4, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Insta4.png', isVideo: true },
  { id: 5, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Insta5.png', isVideo: false },
  { id: 6, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Insta6%20.png', isVideo: false },
  { id: 7, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Insta7.png', isVideo: false },
  { id: 8, imageUrl: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Insta8.png', isVideo: true },
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
    <section className="bg-background py-20 md:py-32" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        {/* Customer Reviews Carousel */}
        <div className="mb-20 md:mb-28">
          <h2 className="font-serif text-3xl md:text-4xl text-center mb-10 md:mb-12">Lo que dicen nuestras clientas</h2>
          <div className="max-w-4xl mx-auto relative">
            <div className="text-center py-10 md:py-12">
              {/* Stars */}
              <div className="flex justify-center gap-1.5 mb-6">
                {[...Array(reviews[currentReview].rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-6 h-6 fill-accent"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              {/* Review Text */}
              <blockquote className="font-serif text-xl md:text-2xl italic text-foreground mb-6 leading-relaxed">
                "{reviews[currentReview].text}"
              </blockquote>
              <p className="text-base text-muted-foreground">— {reviews[currentReview].author}</p>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevReview}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 hover:text-accent transition-colors"
              aria-label="Anterior reseña"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 hover:text-accent transition-colors"
              aria-label="Siguiente reseña"
              suppressHydrationWarning
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2.5 mt-8">
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
          <div className="text-center mb-10">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-baseline justify-center gap-2 mb-2 hover:opacity-60 transition-opacity duration-300 leading-none"
            >
              <Instagram className="w-7 h-7 text-foreground" />
              <h2 className="font-serif text-3xl md:text-4xl leading-none">@marebo_jewelry</h2>
            </a>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
            {INSTAGRAM_POSTS.map((post) => (
              <InstagramPost key={post.id} post={post} />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 bg-primary text-primary-foreground text-base uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-3"
              suppressHydrationWarning
            >
              <Instagram className="w-5 h-5" />
              Seguir en Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function InstagramPost({ post }: { post: typeof INSTAGRAM_POSTS[0] }) {
  return (
    <a
      href={INSTAGRAM_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative aspect-square overflow-hidden bg-secondary/20 group cursor-pointer"
    >
      <Image
        src={post.imageUrl}
        alt="Instagram post"
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 50vw, 25vw"
      />

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300" />

      {post.isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3 transition-transform duration-300 group-hover:scale-105">
            <Play className="w-6 h-6 text-foreground fill-foreground" />
          </div>
        </div>
      )}
    </a>
  )
}
