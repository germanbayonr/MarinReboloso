import SuccessContent from './SuccessContent'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const sessionId = session_id ? String(session_id) : null

  return (
    <main className="min-h-screen bg-background" suppressHydrationWarning>
      <SuccessContent sessionId={sessionId} />
    </main>
  )
}

