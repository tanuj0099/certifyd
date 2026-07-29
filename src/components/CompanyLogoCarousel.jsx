import React from 'react'
import { motion } from 'framer-motion'
import { 
  SiAmazonaws, 
  SiGooglecloud, 
  SiMicrosoft, 
  SiCisco, 
  SiSalesforce, 
  SiOracle, 
  SiIbm 
} from 'react-icons/si'

export default function CompanyLogoCarousel() {
  const companies = [
    { name: 'AWS', icon: SiAmazonaws },
    { name: 'Google Cloud', icon: SiGooglecloud },
    { name: 'Microsoft', icon: SiMicrosoft },
    { name: 'Cisco', icon: SiCisco },
    { name: 'Salesforce', icon: SiSalesforce },
    { name: 'Oracle', icon: SiOracle },
    { name: 'IBM', icon: SiIbm },
  ]

  // duplicate to ensure seamless loop
  const duplicatedCompanies = [...companies, ...companies, ...companies]

  return (
    <div style={{
      width: '100%',
      padding: '40px 0',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-4)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: '30px'
      }}>
        SUPPORTED CERTIFICATION PROVIDERS
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex' }}>
        {/* Gradients for smooth fade on edges */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px',
          background: 'linear-gradient(to right, var(--bg), transparent)',
          zIndex: 2, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px',
          background: 'linear-gradient(to left, var(--bg), transparent)',
          zIndex: 2, pointerEvents: 'none'
        }} />

        <motion.div
          animate={{ x: ['0%', '-33.333333%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', width: 'max-content', alignItems: 'center', gap: '80px', paddingLeft: '40px', paddingRight: '40px' }}
        >
          {duplicatedCompanies.map((company, index) => {
            const Icon = company.icon
            return (
              <div key={index} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                color: 'var(--text-3)',
                opacity: 0.7,
                transition: 'opacity 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                <Icon size={24} />
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: '600', fontSize: '16px', letterSpacing: '-0.02em' }}>
                  {company.name}
                </span>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
