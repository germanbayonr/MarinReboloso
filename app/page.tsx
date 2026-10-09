import NavbarWithCollections from '@/components/NavbarWithCollections'
import HomeCollectionsPortada from '@/components/HomeCollectionsPortada'
import NovedadesCarousel from '@/components/NovedadesCarousel'
import SocialProof from '@/components/SocialProof'
import PublicFundingNotice from '@/components/PublicFundingNotice'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavbarWithCollections />
      <HomeCollectionsPortada />
      <NovedadesCarousel />
      <SocialProof />
      <PublicFundingNotice />
      <Footer />
    </main>
  )
}
