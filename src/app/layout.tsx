import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Certifyd Waitlist | Know the ROI before you invest",
  description: "Verify ROI before you buy. Negotiate before you accept. The definitive data engine for Indian IT certifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} antialiased bg-background text-text-primary selection:bg-brand/20 selection:text-brand`}
      >
        {children}
      </body>
    </html>
  );
}
