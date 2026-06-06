import NavbarWithCollections from '@/components/NavbarWithCollections'
import HomeCollectionsPortada from '@/components/HomeCollectionsPortada'
import NovedadesCarousel from '@/components/NovedadesCarousel'
import SocialProof from '@/components/SocialProof'
import Footer from '@/components/Footer'
import { HomePreloadBoot } from '@/components/HomePreloadBoot'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HomePreloadBoot />
      <NavbarWithCollections />
      <HomeCollectionsPortada />
      <NovedadesCarousel />
      <SocialProof />
      <Footer />
    </main>
  )
}
