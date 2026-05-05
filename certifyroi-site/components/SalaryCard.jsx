'use client'

export default function SalaryCard({ data }) {
  const minL = (data.min_salary / 100000).toFixed(1)
  const maxL = (data.max_salary / 100000).toFixed(1)
  const avgL = ((data.min_salary + data.max_salary) / 200000).toFixed(1)
  const jobs = data.job_count_naukri ? data.job_count_naukri.toLocaleString('en-IN') : 'N/A'

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: 24,
      borderRadius: 16,
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>{data.domain_name}</h3>

      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 4 }}>
        ₹{minL}L - ₹{maxL}L
      </div>
      <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: 16 }}>
        per year (avg: ₹{avgL}L)
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>💼</span>
        <span>{jobs} jobs on Naukri</span>
      </div>

      <div style={{
        marginTop: 12,
        fontSize: '0.75rem',
        opacity: 0.6,
      }}>
        Updated: {new Date(data.updated_at).toLocaleDateString('en-IN')}
      </div>
    </div>
  )
}
