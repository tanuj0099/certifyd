const fs = require('fs');
const file = 'c:/Users/Tanuj Rajdev/Downloads/certifyroi/certifyroi/src/components/LandingPage.jsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const newLines = [];
const replacement = `// ---------------------------------------------------------
// TOKENS
// ---------------------------------------------------------
const F_SERIF = "'EB Garamond', 'Cormorant Garamond', Georgia, serif"
const F_SANS  = "'Inter', 'DM Sans', sans-serif"
const F_MONO  = "'JetBrains Mono', 'IBM Plex Mono', monospace"

const RISE = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
}

// ---------------------------------------------------------
// PRIMITIVES
// ---------------------------------------------------------
function CrosshairIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1" x2="7" y2="13" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="1" y1="7" x2="13" y2="7" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}

function CountUp({ end, prefix = '', suffix = '', duration = 1.8 }) {
  const [count, setCount] = useState(0)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!on) return
    const v = parseFloat(String(end).replace(/[^0-9.]/g, ''))
    const frames = Math.round(duration * 60)
    let f = 0
    const t = setInterval(() => {
      f++
      setCount(v * (1 - Math.pow(1 - f / frames, 3)))
      if (f >= frames) { setCount(v); clearInterval(t) }
    }, 1000 / 60)
    return () => clearInterval(t)
  }, [on, end, duration])
  return <motion.span onViewportEnter={() => setOn(true)}>{prefix}{count.toLocaleString('en-IN', { maximumFractionDigits: String(end).includes('.') ? 1 : 0 })}{suffix}</motion.span>
}

function PillBtn({ onClick = () => {}, children, large, primary = false }) {
  const [h, setH] = useState(false)
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: large ? '0 30px' : '0 22px',
        height: large ? '54px' : '44px',
        background: primary ? 'var(--text)' : 'var(--bg-elevated)',
        border: primary ? '1px solid var(--text)' : '1px solid var(--border)',
        borderRadius: '9999px',
        fontSize: large ? '12px' : '11px',
        fontFamily: F_SANS, fontWeight: '600',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        cursor: 'pointer',
        color: primary ? 'var(--bg)' : 'var(--text)',
        boxShadow: primary ? \`0 4px 14px transparent\` : \`0 2px 8px transparent\`,
        transition: 'all 0.3s ease',
      }}
    >
      {children}
    </motion.button>
  )
}
`;

for(let i=0; i<lines.length; i++) {
  if (i === 26) {
    newLines.push(replacement);
  } else if (i > 26 && i <= 38) {
    // skip
  } else {
    newLines.push(lines[i]);
  }
}
fs.writeFileSync(file, newLines.join('\n'));
console.log('done');
