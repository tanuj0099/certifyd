'use client'

import { useEffect, useState } from 'react'

export default function EnvTest() {
  const [envStatus, setEnvStatus] = useState('Checking...')

  useEffect(() => {
    try {
      const url = process.env.VITE_SUPABASE_URL
      const key = process.env.VITE_SUPABASE_ANON_KEY

      setEnvStatus(`URL: ${url ? 'SET' : 'NOT SET'}, KEY: ${key ? 'SET' : 'NOT SET'}`)
    } catch (error) {
      setEnvStatus(`Error: ${error.message}`)
    }
  }, [])

  return (
    <div style={{ padding: 20, background: '#f0f0f0', margin: 20 }}>
      <h3>Environment Variables Test</h3>
      <p>Status: {envStatus}</p>
    </div>
  )
}