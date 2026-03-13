import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Preloader from '@/components/Preloader'
import Providers from './providers'
import './globals.css'

const BRAND_NAME = 'Marebo Jewelry'
const BRAND_TITLE = 'Marebo Jewelry | Joyería Artesanal y Mantones de Diseño'
const BRAND_DESCRIPTION =
  'Descubre la exclusividad de Marebo Jewelry. Diseños únicos en joyería artesanal y mantones de alta calidad. Elegancia con esencia del Sur.'
const ICON_VERSION = '20260313'
const BRAND_LOGO_URL =
  `https://nwpjxibuaxclzogatfcl.supabase.co/storage/v1/object/public/product-images/assets/Captura%20de%20pantalla%202026-03-10%20a%20las%2011.28.12.jpg?v=${ICON_VERSION}`

export const metadata: Metadata = {
  title: {
    default: BRAND_TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  keywords: [
    'joyería artesanal',
    'joyería',
    'mantones',
    'accesorios de mujer',
    'diseño',
    'Sevilla',
  ],
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    type: 'website',
    siteName: BRAND_NAME,
    locale: 'es_ES',
    images: [
      {
        url: BRAND_LOGO_URL,
        alt: BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    images: [BRAND_LOGO_URL],
  },
  icons: {
    icon: [
      {
        url: BRAND_LOGO_URL,
        type: 'image/jpeg',
      },
    ],
    apple: [
      {
        url: BRAND_LOGO_URL,
        type: 'image/jpeg',
      },
    ],
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
