import { Suspense } from 'react'
import LegalPageClient from './LegalPageClient'

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LegalPageClient />
    </Suspense>
  )
}
