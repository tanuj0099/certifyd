import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, THEME_PRESETS } from '../hooks/useTheme'

const FM = "var(--font-mono)";

export default function ThemeToggle() {
  const { themeId, toggleTheme } = useTheme()
  const current = THEME_PRESETS[themeId]

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.04 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', borderRadius: '100px',
        background: current.surface,
        border: `1px solid ${current.border}`,
        cursor: 'pointer',
        transition: 'background 0.25s, border 0.25s',
      }}
    >
      {/* Color swatch */}
      <div style={{
        width: '10px', height: '10px', borderRadius: '50%',
        background: current.bg,
        border: `1.5px solid ${current.text}`,
        transition: 'background 0.3s',
      }} />
      <AnimatePresence mode="wait">
        <motion.span
          key={themeId}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            fontFamily: FM, fontSize: '10px',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: current.text2,
            fontWeight: '600',
          }}
        >
          {current.label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}