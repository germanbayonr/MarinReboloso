import Navbar from '@/components/Navbar'
import ProductListingClient from '@/components/ProductListingClient'
import { Metadata } from 'next'

type PageProps = {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const formattedCategory = category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  return {
    title: `${formattedCategory} | Wayfar Brand`,
    description: `Descubre nuestra colección de ${formattedCategory} con elegancia andaluza y artesanía de lujo.`,
  }
}

export default async function ShopPage({ params }: PageProps) {
  const { category } = await params

  return (
    <>
      <Navbar />
      <ProductListingClient category={category} />
    </>
  )
}
