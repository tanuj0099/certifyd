import { useEffect, useState } from 'react'

function getThemeFromDocument() {
  if (typeof document === 'undefined') {
    return {
      mode: 'dark',
      isDark: true,
      colors: {
        background: '#0B1120',
        foreground: '#F8FAFC',
      },
    }
  }

  const dataTheme = document.documentElement.dataset.theme
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const mode = dataTheme === 'light' ? 'light' : dataTheme === 'dark' ? 'dark' : prefersDark ? 'dark' : 'light'
  const isDark = mode === 'dark'

  return {
    mode,
    isDark,
    colors: isDark
      ? { background: '#0B1120', foreground: '#F8FAFC' }
      : { background: '#F8FAFC', foreground: '#111827' },
  }
}

export function useCanvasTheme() {
  const [theme, setTheme] = useState(getThemeFromDocument)

  useEffect(() => {
    const updateTheme = () => setTheme(getThemeFromDocument())

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    const matcher = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (matcher?.addEventListener) {
      matcher.addEventListener('change', updateTheme)
    } else if (matcher?.addListener) {
      matcher.addListener(updateTheme)
    }

    return () => {
      observer.disconnect()
      if (matcher?.removeEventListener) {
        matcher.removeEventListener('change', updateTheme)
      } else if (matcher?.removeListener) {
        matcher.removeListener(updateTheme)
      }
    }
  }, [])

  return theme
}
