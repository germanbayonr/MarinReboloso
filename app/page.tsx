import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import CollectionBanners from '@/components/CollectionBanners'
import NovedadesCarousel from '@/components/NovedadesCarousel'
import SocialProof from '@/components/SocialProof'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen" suppressHydrationWarning>
      <Navbar />
      <HeroSection />
      <CollectionBanners />
      <NovedadesCarousel />
      <SocialProof />
      <Footer />
    </main>
  )
}
