import { useState, useEffect, createContext, useContext, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════
// 3-THEME ENGINE — Light / Dark / System
// ═══════════════════════════════════════════════════════════
// System mode auto-detects prefers-color-scheme and follows the OS.
// Light = bg #FFFFFF, Dark = bg #222326
// ═══════════════════════════════════════════════════════════

export const THEME_PRESETS = {
  dark: {
    id: 'dark',
    label: 'Dark',
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
  light: {
    id: 'light',
    label: 'Light',
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

// Backward compat aliases
export const THEME_ORDER = ['dark', 'light', 'system']
// Legacy aliases kept for any code referencing nordic/ash
export const THEME_PRESETS_COMPAT = {
  ...THEME_PRESETS,
  nordic: THEME_PRESETS.dark,
  ash: THEME_PRESETS.light,
}

const STORAGE_KEY = 'croi_theme_v2'

function getSystemDark() {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true
}

function resolveTheme(mode) {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  return getSystemDark() ? 'dark' : 'light'
}

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    } catch {}
    return 'system'
  })

  const [resolvedId, setResolvedId] = useState(() => resolveTheme(mode))

  // Apply the data-theme attribute whenever mode or system preference changes
  useEffect(() => {
    const apply = () => {
      const id = resolveTheme(mode)
      setResolvedId(id)
      document.documentElement.setAttribute('data-theme', id === 'dark' ? 'nordic' : 'ash')
    }

    apply()

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [mode])

  const setThemeMode = useCallback((newMode) => {
    setMode(newMode)
    try { localStorage.setItem(STORAGE_KEY, newMode) } catch {}
  }, [])

  // Legacy toggleTheme — cycles dark → light → dark
  const toggleTheme = useCallback(() => {
    setThemeMode(resolvedId === 'dark' ? 'light' : 'dark')
  }, [resolvedId, setThemeMode])

  const current = THEME_PRESETS[resolvedId] || THEME_PRESETS.dark
  const isDark = !current.isLight

  return (
    <ThemeContext.Provider value={{
      mode,            // 'light' | 'dark' | 'system'
      theme: resolvedId,
      themeId: resolvedId,
      current,
      isDark,
      setThemeMode,
      setTheme: setThemeMode,
      toggleTheme,
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
