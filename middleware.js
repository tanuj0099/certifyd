import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const config = {
  // Matches all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|vite.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

export default async function middleware(req) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const url = new URL(req.url);

  // 1. Force HTTPS
  // In Vercel, x-forwarded-proto tells us if the original request was http
  if (req.headers.get('x-forwarded-proto') === 'http' && !url.hostname.includes('localhost')) {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // 2. Strict CORS Handling & CSRF Protection for API routes
  if (url.pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      'https://certifyd.in',
      'https://www.certifyd.in',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
      process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3000' : null,
    ].filter(Boolean);

    // If a cross-origin mutation is attempted from an unapproved Origin, reject immediately with 403 Forbidden
    if (origin && !allowedOrigins.includes(origin) && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return NextResponse.json(
        { error: 'Forbidden: Unauthorized cross-origin request.' },
        { status: 403 }
      );
    }

    const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Prepare response headers for normal API requests
    Object.entries(corsHeaders).forEach(([key, val]) => res.headers.set(key, val));
  }

  // 3. Staging Basic Auth
  if (url.hostname.includes('staging') || url.hostname.includes('certifyd.vercel.app')) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      const expectedUser = process.env.STAGING_AUTH_USER || 'admin';
      const expectedPwd = process.env.STAGING_AUTH_PASSWORD;
      if (expectedPwd && user === expectedUser && pwd === expectedPwd) {
        // Continue to Supabase session refresh
      } else {
        return new NextResponse('Unauthorized Access', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Certifyd Staging Area"',
          },
        });
      }
    } else {
      return new NextResponse('Unauthorized Access', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Certifyd Staging Area"',
        },
      });
    }
  }

  // 4. Supabase Session Token Rotation (prevents session fixation & refreshes access tokens)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
              res = NextResponse.next({
                request: {
                  headers: req.headers,
                },
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                res.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      // Refresh session if expired
      await supabase.auth.getUser();
    } catch {
      // Ignore errors if Supabase is unreachable in edge context
    }
  }

  return res;
}