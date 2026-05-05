export default function StatBox({ label, value }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #eee',
      borderRadius: 12,
      padding: '16px 24px',
      minWidth: 160,
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ color: '#111', fontSize: '1.5rem', fontWeight: 'bold' }}>
        {value}
      </div>
    </div>
  )
}
