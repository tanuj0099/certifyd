export const metadata = {
  title: 'CertifyROI - Market Intelligence',
  description: 'Real-time salary data for tech roles in India',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f5f5f5' }}>{children}</body>
    </html>
  )
}
