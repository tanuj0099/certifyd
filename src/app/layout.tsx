import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import TargetCursor from "@/components/reactbits/TargetCursor";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sifonnFont = localFont({
  src: "./fonts/SIFONN_PRO.otf",
  variable: "--font-sifonn",
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
    <html lang="en" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${sifonnFont.variable} ${jetbrainsMono.variable} antialiased bg-background text-text-primary selection:bg-brand/20 selection:text-brand`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <TargetCursor targetSelector=".cursor-target" spinDuration={2} cursorColor="var(--text-primary)" cursorColorOnTarget="var(--brand)" />
        </ThemeProvider>
      </body>
    </html>
  );
}
