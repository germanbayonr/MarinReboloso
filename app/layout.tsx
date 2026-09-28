import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import HomeImagePreloadHead from '@/components/HomeImagePreloadHead'
import Providers from './providers'
import WhatsAppFloatingButtonGate from '@/components/WhatsAppFloatingButtonGate'
import {
  SITE_BRAND_ICON_URL,
  SITE_BRAND_LOGO_URL,
  SITE_OG_DEFAULT,
  SITE_PUBLIC_ORIGIN,
} from '@/lib/site-brand'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_PUBLIC_ORIGIN),
  title: SITE_OG_DEFAULT.title,
  description: SITE_OG_DEFAULT.description,
  icons: {
    icon: [
      { url: SITE_BRAND_ICON_URL, sizes: '512x512', type: 'image/jpeg' },
      { url: '/brand/marebo-icon-512.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    apple: [{ url: SITE_BRAND_ICON_URL, sizes: '512x512' }],
    shortcut: SITE_BRAND_ICON_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: SITE_PUBLIC_ORIGIN,
    siteName: 'Marebo Jewelry',
    title: SITE_OG_DEFAULT.title,
    description: SITE_OG_DEFAULT.description,
    images: [
      {
        url: SITE_BRAND_LOGO_URL,
        width: 1024,
        height: 724,
        alt: 'MAREBO — María Marín Reboloso',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_OG_DEFAULT.title,
    description: SITE_OG_DEFAULT.description,
    images: [SITE_BRAND_LOGO_URL],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HomeImagePreloadHead />
        <link rel="icon" href={SITE_BRAND_ICON_URL} sizes="512x512" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <WhatsAppFloatingButtonGate />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
