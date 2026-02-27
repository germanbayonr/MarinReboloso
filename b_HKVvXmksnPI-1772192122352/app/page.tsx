import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import CollectionsGrid from '@/components/CollectionsGrid'
import SocialProof from '@/components/SocialProof'

export default function Home() {
  return (
    <main className="min-h-screen" suppressHydrationWarning>
      <Navbar />
      <HeroSection />
      <CollectionsGrid />
      <SocialProof />
      
      {/* Footer */}
      <footer className="bg-background border-t border-border px-4 md:px-8 py-12" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="font-serif text-lg mb-4 tracking-wider">WAYFAR BRAND</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elegancia andaluza para el mundo moderno.
            </p>
          </div>
          <div>
            <h4 className="font-sans text-sm tracking-wider mb-4 uppercase">Ayuda</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent transition-colors" suppressHydrationWarning>Envíos</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" suppressHydrationWarning>Devoluciones</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" suppressHydrationWarning>Guía de Tallas</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-sm tracking-wider mb-4 uppercase">Contacto</h4>
            <p className="text-sm text-muted-foreground">info@wayfarbrand.com</p>
            <p className="text-sm text-muted-foreground mt-2">+34 955 123 456</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Wayfar Brand. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
