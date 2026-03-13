import { redirect } from 'next/navigation'

export default function LegacyProductRedirect({ params }: { params: { id: string } }) {
  redirect(`/producto/${params.id}`)
}
