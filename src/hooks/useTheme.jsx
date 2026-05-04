import { useState, useEffect, createContext, useContext, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════
// 5-THEME ENGINE — Nordic Design System
// ═══════════════════════════════════════════════════════════
// Each preset is a self-contained object. Components read
// from CSS variables set by data-theme, OR from the JS object
// returned by useTheme() for inline styles.
// ═══════════════════════════════════════════════════════════

export const THEME_PRESETS = {
  nordic: {
    id: 'nordic',
    label: 'Nordic Gray',
    bg:       '#222326',
    bgAlt:    '#2A2A2E',
    surface:  '#2A2A2E',
    text:     '#F4F5F8',
    text2:    '#A0A3AB',
    text3:    '#6B6E76',
    text4:    '#44474F',
    accent:   '#F4F5F8',
    gold:     '#C9A84C',
    border:   'rgba(255,255,255,0.08)',
    borderMid:'rgba(255,255,255,0.14)',
    isLight:  false,
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    bg:       '#0F0F10',
    bgAlt:    '#161618',
    surface:  '#161618',
    text:     '#EEEFF1',
    text2:    '#8B8D95',
    text3:    '#5A5C63',
    text4:    '#3A3C42',
    accent:   '#EEEFF1',
    gold:     '#C9A84C',
    border:   'rgba(255,255,255,0.08)',
    borderMid:'rgba(255,255,255,0.14)',
    isLight:  false,
  },
  ash: {
    id: 'ash',
    label: 'Ash',
    bg:       '#FFFFFF',
    bgAlt:    '#F8F8F9',
    surface:  '#F8F8F9',
    text:     '#44494D',
    text2:    '#6B7075',
    text3:    '#9CA0A5',
    text4:    '#C4C7CB',
    accent:   '#222326',
    gold:     '#9A7828',
    border:   'rgba(0,0,0,0.05)',
    borderMid:'rgba(0,0,0,0.10)',
    isLight:  true,
  },
  dawn: {
    id: 'dawn',
    label: 'Dawn',
    bg:       '#2A222E',
    bgAlt:    '#322A36',
    surface:  '#322A36',
    text:     '#EEEFF1',
    text2:    '#A39AAB',
    text3:    '#6E6575',
    text4:    '#4A4252',
    accent:   '#EEEFF1',
    gold:     '#C9A84C',
    border:   'rgba(255,255,255,0.08)',
    borderMid:'rgba(255,255,255,0.14)',
    isLight:  false,
  },
  pale: {
    id: 'pale',
    label: 'Pale',
    bg:       '#292D3E',
    bgAlt:    '#313546',
    surface:  '#313546',
    text:     '#EEEFF1',
    text2:    '#9DA1B0',
    text3:    '#6A6E7E',
    text4:    '#454958',
    accent:   '#EEEFF1',
    gold:     '#C9A84C',
    border:   'rgba(255,255,255,0.08)',
    borderMid:'rgba(255,255,255,0.14)',
    isLight:  false,
  },
}

export const THEME_ORDER = ['nordic', 'midnight', 'ash', 'dawn', 'pale']

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    try {
      const stored = localStorage.getItem('croi_theme')
      // Migrate legacy "dark"/"light" to new system
      if (stored === 'dark') return 'nordic'
      if (stored === 'light') return 'ash'
      if (stored && THEME_PRESETS[stored]) return stored
      return 'nordic'
    } catch { return 'nordic' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
    try { localStorage.setItem('croi_theme', themeId) } catch {}
  }, [themeId])

  const setTheme = useCallback((id) => {
    if (THEME_PRESETS[id]) setThemeId(id)
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeId(prev => {
      const idx = THEME_ORDER.indexOf(prev)
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length]
    })
  }, [])

  // Backward compat: isDark, toggle
  const current = THEME_PRESETS[themeId] || THEME_PRESETS.nordic
  const isDark = !current.isLight

  return (
    <ThemeContext.Provider value={{
      theme: themeId,
      themeId,
      current,
      isDark,
      setTheme,
      cycleTheme,
      toggle: cycleTheme,  // backward compat
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default useTheme