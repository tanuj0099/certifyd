import { Inter } from 'next/font/google'
import '../globals.css'
import { CSPostHogProvider } from '../components/providers/PostHogProvider'
const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  metadataBase: new URL('https://certifyd.in'),
  title: 'Live Market Pulse | Certify',
  description: 'Real-time salary floors and dynamic demand metrics for elite tech roles in India.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Live Market Pulse | Certify',
    description: 'Real-time salary floors and dynamic demand metrics for elite tech roles in India.',
    url: 'https://certifyd.in/market-pulse',
    siteName: 'Certify',
    images: [
      {
        url: 'https://certifyd.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Certify Market Pulse',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Market Pulse | Certify',
    description: 'Real-time salary floors and dynamic demand metrics for elite tech roles in India.',
    images: ['https://certifyd.in/og-image.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, background: '#f5f5f5' }}>
        <CSPostHogProvider>
          {children}
        </CSPostHogProvider>
      </body>
    </html>
  )
}
