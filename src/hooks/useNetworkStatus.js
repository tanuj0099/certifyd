/**
 * useNetworkStatus
 *
 * Detects browser online/offline state using the Navigator API and
 * the 'online'/'offline' window events. Returns a boolean that is
 * true when the browser has a network connection and false when it
 * does not.
 *
 * Usage:
 *   const isOnline = useNetworkStatus()
 *   if (!isOnline) return <OfflineBanner />
 */
import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  // navigator.onLine is synchronously available — use it as the initial value
  // so there is no flash of incorrect state on first render.
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    function handleOnline()  { setIsOnline(true)  }
    function handleOffline() { setIsOnline(false) }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Sync once on mount in case the state changed between SSR and hydration
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
