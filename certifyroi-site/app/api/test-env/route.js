import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    allEnv: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  })
}