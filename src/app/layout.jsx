import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display, Geist } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
import ConsoleGreeting from '@/components/ConsoleGreeting';
import ConsentManager from '@/components/ConsentManager';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '@/index.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://certifyd.in'),
  title: 'Certifyd | Certification ROI & Offer Letter Intelligence',
  description: "The data engine for India's tech careers. Calculate exact certification ROI, safely analyze offer letters, and benchmark salary premiums using verified market data.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Certifyd | Certification ROI & Offer Letter Intelligence',
    description: "The data engine for India's tech careers. Calculate exact certification ROI, safely analyze offer letters, and benchmark salary premiums using verified market data.",
    url: 'https://certifyd.in',
    siteName: 'Certifyd',
    images: [
      {
        url: 'https://certifyd.in/logo.png',
        width: 1200,
        height: 630,
        alt: 'Certifyd Data Engine',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Certifyd | Certification ROI & Offer Letter Intelligence',
    description: "The data engine for India's tech careers. Calculate exact certification ROI, safely analyze offer letters, and benchmark salary premiums using verified market data.",
    images: ['https://certifyd.in/logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn(inter.variable, plusJakarta.variable, jetbrains.variable, playfair.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="schema-local-business" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Certifyd",
            "url": "https://certifyd.in",
            "logo": "https://certifyd.in/logo.png",
            "description": "The data engine for India's tech careers. Calculate exact certification ROI, safely analyze offer letters, and benchmark salary premiums using verified market data.",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "IN"
            }
          })
        }} />
        <Script id="schema-website" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Certifyd",
            "url": "https://certifyd.in"
          })
        }} />
        <ConsentManager />
        <Providers>
          <ConsoleGreeting />
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
