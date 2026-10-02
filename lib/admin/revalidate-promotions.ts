import { revalidatePath } from 'next/cache'

export function revalidatePromotionSurfaces() {
  revalidatePath('/admin/promotions', 'page')
  revalidatePath('/checkout', 'page')
  revalidatePath('/', 'page')
}
