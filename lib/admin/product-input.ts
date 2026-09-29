import type { ProductVariantsData } from '@/lib/product-variants'

export interface AdminProductInput {
  name: string
  description: string | null
  category: string
  collection: string | null
  image_url: string | null
  image_urls?: string[] | null
  is_new_arrival: boolean
  in_stock: boolean
  original_price: number
  discount_percent: number
  has_variants?: boolean
  variants?: ProductVariantsData
}
