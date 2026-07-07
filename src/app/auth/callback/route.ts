import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        let { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_complete')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (!profile) {
          const { data: altProfile } = await supabase
            .from('user_profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .maybeSingle()
          profile = altProfile
        }
        
        if (profile?.onboarding_complete) {
          // Already onboarded → dashboard
          const target = next !== '/onboarding' ? next : '/dashboard'
          return NextResponse.redirect(`${origin}${target.startsWith('/') ? target : '/' + target}`)
        } else {
          // Not onboarded → onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
    }
  }

  // Something went wrong
  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
