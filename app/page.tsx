import NavbarWithCollections from '@/components/NavbarWithCollections'
import HeroSection from '@/components/HeroSection'
import CollectionBanners from '@/components/CollectionBanners'
import NovedadesCarousel from '@/components/NovedadesCarousel'
import SocialProof from '@/components/SocialProof'
import Footer from '@/components/Footer'
import { HomePreloadBoot } from '@/components/HomePreloadBoot'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HomePreloadBoot />
      <NavbarWithCollections />
      <HeroSection />
      <CollectionBanners />
      <NovedadesCarousel />
      <SocialProof />
      <Footer />
    </main>
  )
}
