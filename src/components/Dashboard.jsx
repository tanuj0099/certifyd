import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [marketData, setMarketData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState('')

  useEffect(() => {
    async function fetchMarketPulse() {
      const { data, error } = await supabase
        .from('market_intelligence')
        .select('*')
        .order('avg_salary_max', { ascending: false })
        .limit(12)

      if (error) {
        console.error('Error fetching data:', error)
      } else {
        setMarketData(data || [])
        if (data && data.length > 0) {
          const date = new Date(data[0].updated_at)
          setLastSync(date.toLocaleDateString() + ' ' + date.toLocaleTimeString())
        }
      }
      setLoading(false)
    }

    fetchMarketPulse()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', letterSpacing: '-0.04em', marginBottom: '8px' }}>Market Pulse</h1>
          <p style={{ color: 'var(--text-3)' }}>Real-time ROI and salary intelligence.</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', fontFamily: 'var(--font-mono)',
          color: 'var(--text-2)',
          padding: '4px 12px', borderRadius: '9999px',
          border: '1px solid var(--border)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-2)' }} />
          <span>SYNCED: {loading ? 'Fetching...' : lastSync}</span>
        </div>
      </div>
      <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {loading ? (
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{ height: '160px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface)' }}
                className="animate-pulse"
              />
            ))
        ) : (
          marketData.map((job) => (
            <div
              key={job.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                transition: 'border-color 0.3s',
                background: 'var(--surface)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '16px' }}>{job.domain_name}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-3)' }}>Avg. Salary Limit</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '500' }}>₹{(job.avg_salary_max / 100000).toFixed(1)}L</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-3)' }}>Active Demand</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{job.job_count_naukri.toLocaleString()} jobs</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
