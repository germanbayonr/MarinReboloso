import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Preloader from '@/components/Preloader'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marebo Jewelry | Joyería Artesanal',
  description: 'Elegancia y esencia del Sur',
  icons: {
    icon: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Captura%20de%20pantalla%202026-03-10%20a%20las%2011.28.12.jpg',
    apple: 'https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Captura%20de%20pantalla%202026-03-10%20a%20las%2011.28.12.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <Preloader />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
