import PromotionsAdminClient from '@/components/admin/PromotionsAdminClient'
import { getPromotions } from '@/app/admin/promotions/actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPromotionsPage() {
  const promotions = await getPromotions()
  return <PromotionsAdminClient initialPromotions={promotions} />
}
