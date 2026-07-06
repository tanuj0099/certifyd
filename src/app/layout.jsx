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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn(inter.variable, plusJakarta.variable, jetbrains.variable, playfair.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
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
