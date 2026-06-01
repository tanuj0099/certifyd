import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import { Providers } from './providers';
import '@/index.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://certifyroi.in'),
  title: 'Certify | ROI Projections & Career Tools',
  description: 'AI-powered resume analysis, certification ROI projections, and career roadmaps.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} ${playfair.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
