import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

export function isTurnstileEnabled() {
  return Boolean(SITE_KEY)
}

export default function TurnstileWidget({ onVerify, onExpire, onError }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!SITE_KEY) {
      onVerify?.('turnstile-disabled')
      return undefined
    }

    function render() {
      if (!window.turnstile || !containerRef.current) return
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: document.documentElement.getAttribute('data-theme') === 'ash' ? 'light' : 'dark',
        callback: (token) => onVerify?.(token),
        'expired-callback': () => {
          onExpire?.()
          onVerify?.('')
        },
        'error-callback': () => onError?.(),
      })
      setReady(true)
    }

    if (window.turnstile) {
      render()
      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            /* ignore */
          }
        }
      }
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = render
    document.head.appendChild(script)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
      }
    }
  }, [onVerify, onExpire, onError])

  if (!SITE_KEY) return null

  return (
    <motion.div
      style={{ minHeight: ready ? 'auto' : '65px', display: 'flex', justifyContent: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div ref={containerRef} />
    </motion.div>
  )
}
