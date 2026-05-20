import { motion } from 'framer-motion'

const F_SANS = "'Inter', 'DM Sans', sans-serif"
const F_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace"

export function DashPanel({ children, style = {}, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`dash-panel ${className}`.trim()}
      style={style}
    >
      {children}
    </motion.section>
  )
}

export function DashTabs({ tabs, active, onChange }) {
  return (
    <div className="dash-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`dash-tab${active === tab.id ? ' dash-tab--active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function DashField({ label, children }) {
  return (
    <label className="dash-field">
      <span className="dash-field__label">{label}</span>
      {children}
    </label>
  )
}

export function DashInput(props) {
  return <input className="dash-input" {...props} />
}

export function DashTextarea(props) {
  return <textarea className="dash-input dash-textarea" {...props} />
}

export function DashButton({ children, variant = 'primary', type = 'button', ...props }) {
  return (
    <button type={type} className={`dash-btn dash-btn--${variant}`} {...props}>
      {children}
    </button>
  )
}

export function DashStat({ label, value, hint }) {
  return (
    <motion.div className="dash-stat">
      <div className="dash-stat__label">{label}</div>
      <div className="dash-stat__value">{value}</div>
      {hint ? <div className="dash-stat__hint">{hint}</div> : null}
    </motion.div>
  )
}

export default function DashboardShell({
  eyebrow,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
}) {
  return (
    <div className="dash-page">
      <main className="dash-page__inner">
        <header className="dash-header">
          <div className="dash-header__copy">
            {eyebrow ? <p className="dash-eyebrow">{eyebrow}</p> : null}
            <h1 className="dash-title">{title}</h1>
            {subtitle ? <p className="dash-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="dash-header__actions">{actions}</div> : null}
        </header>

        {tabs?.length ? (
          <DashTabs tabs={tabs} active={activeTab} onChange={onTabChange} />
        ) : null}

        <div className="dash-content">{children}</div>
      </main>
    </div>
  )
}

export { F_SANS, F_MONO }
