import { redirect } from 'next/navigation'

export default function LegacyProductDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/producto/${params.id}`)
}
