const stats = [
  {
    label: 'Payback Period',
    value: '6 mo',
    copy: 'Approximate window to recover the certification investment.',
  },
  {
    label: 'Salary Delta',
    value: '35%',
    copy: 'Estimated market lift compared with the current baseline.',
  },
]

export default function StatsSection() {
  return (
    <section
      style={{
        width: '100%',
        padding: '96px 24px',
        background: 'var(--bg)',
        color: 'var(--text)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ width: 'min(100%, 960px)', margin: '0 auto' }}>
        <p
          style={{
            margin: '0 0 32px',
            color: 'var(--text-muted)',
            fontFamily: "'Inter','DM Sans',sans-serif",
            fontSize: '16px',
          }}
        >
          Performance metrics
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {stats.map((stat) => (
            <article
              key={stat.label}
              style={{
                padding: '28px 0',
                borderTop: '1px solid var(--border)',
                background: 'transparent',
              }}
            >
              <span
                style={{
                  display: 'block',
                  marginBottom: '18px',
                  color: 'var(--text-soft)',
                  fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {stat.label}
              </span>
              <strong
                style={{
                  display: 'block',
                  marginBottom: '16px',
                  color: 'var(--accent)',
                  fontFamily: "'Inter','DM Sans',sans-serif",
                  fontSize: '48px',
                  lineHeight: 1,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                {stat.value}
              </strong>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-muted)',
                  fontFamily: "'Inter','DM Sans',sans-serif",
                  fontSize: '15px',
                  lineHeight: 1.65,
                }}
              >
                {stat.copy}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
