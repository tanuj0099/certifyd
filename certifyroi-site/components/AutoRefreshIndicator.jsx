"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AutoRefreshIndicator() {
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    // Poll Supabase every 5 minutes
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('market_intelligence')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data?.updated_at && lastUpdate && data.updated_at !== lastUpdate) {
        setLastUpdate(data.updated_at)
        window.location.reload() // or refetch data
      } else if (data?.updated_at && !lastUpdate) {
        setLastUpdate(data.updated_at)
      }
    }, 300000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [lastUpdate])

  return null // It's just a background process, the badge is handled in server component
}
