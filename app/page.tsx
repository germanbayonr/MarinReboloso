import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import CollectionsGrid from '@/components/CollectionsGrid'
import NovedadesCarousel from '@/components/NovedadesCarousel'
import SocialProof from '@/components/SocialProof'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen" suppressHydrationWarning>
      <Navbar />
      <HeroSection />
      <CollectionsGrid />
      <NovedadesCarousel />
      <SocialProof />
      <Footer />
    </main>
  )
}
