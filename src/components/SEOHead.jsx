import { Helmet } from 'react-helmet-async'

export default function SEOHead({ 
  title = 'CertifyROI | Certification ROI Calculator', 
  description = 'Calculate the exact return on investment for your next tech certification. Salary benchmarks and active demand data for India.', 
  path = '', 
  schema,
  children 
}) {
  const url = `https://certifyroi.in${path}`
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://certifyroi.in/og-image.png" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://certifyroi.in/og-image.png" />
      
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}

      {children}
    </Helmet>
  )
}
