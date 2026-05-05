import { useState, useEffect, createContext, useContext, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════
// 2-THEME ENGINE — Linear "Nordic/Ash"
// ═══════════════════════════════════════════════════════════
// Source of truth:
// - Nordic (Dark): bg #222326, text/logo #F4F5F8, border rgba(255,255,255,0.08)
// - Ash (Light):   bg #FFFFFF, text #44494D,     border #E5E5E5
// Components should prefer CSS variables. The JS preset exists
// for inline styles where needed.
// ═══════════════════════════════════════════════════════════

export const THEME_PRESETS = {
  nordic: {
    id: 'nordic',
    label: 'Nordic',
    bg: '#222326',
    bgAlt: '#2A2A2E',
    surface: '#2A2A2E',
    text: '#F4F5F8',
    text2: '#A0A3AB',
    text3: '#6B6E76',
    text4: '#44474F',
    accent: '#F4F5F8',
    border: 'rgba(255,255,255,0.08)',
    borderMid: 'rgba(255,255,255,0.14)',
    isLight: false,
  },
  ash: {
    id: 'ash',
    label: 'Ash',
    bg: '#FFFFFF',
    bgAlt: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#44494D',
    text2: '#6B7075',
    text3: '#9CA0A5',
    text4: '#C4C7CB',
    accent: '#222326',
    border: '#E5E5E5',
    borderMid: '#D6D6D6',
    isLight: true,
  },
}

export const THEME_ORDER = ['nordic', 'ash']

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    try {
      const stored = localStorage.getItem('croi_theme')
      if (stored === 'dark') return 'nordic'
      if (stored === 'light') return 'ash'
      if (stored && THEME_PRESETS[stored]) return stored
      return 'nordic'
    } catch {
      return 'nordic'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
    try {
      localStorage.setItem('croi_theme', themeId)
    } catch {}
  }, [themeId])

  const setTheme = useCallback((id) => {
    if (THEME_PRESETS[id]) setThemeId(id)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeId((prev) => (prev === 'ash' ? 'nordic' : 'ash'))
  }, [])

  const current = THEME_PRESETS[themeId] || THEME_PRESETS.nordic
  const isDark = !current.isLight

  return (
    <ThemeContext.Provider value={{
      theme: themeId,
      themeId,
      current,
      isDark,
      setTheme,
      toggleTheme,
      // Backward compat: some components call cycleTheme/toggle
      cycleTheme: toggleTheme,
      toggle: toggleTheme,
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