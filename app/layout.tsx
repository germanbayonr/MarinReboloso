import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Preloader from '@/components/Preloader'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wayfar Brand | Elegancia y Artesanía del Sur',
  description: 'Descubre la elegancia andaluza moderna con Wayfar Brand. Mantones, trajes, pendientes y accesorios artesanales de lujo con tradición flamenca.',
  keywords: ['moda flamenca', 'mantones', 'trajes', 'pendientes', 'artesanía andaluza', 'moda de lujo'],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
