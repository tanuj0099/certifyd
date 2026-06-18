import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display, Geist } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn(inter.variable, plusJakarta.variable, jetbrains.variable, playfair.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-VMZZP1RZYC`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VMZZP1RZYC', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
