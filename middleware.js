import { next } from '@vercel/edge';

export const config = {
  // Matches all routes except static assets
  matcher: ['/((?!assets|vite.svg|favicon.ico).*)'],
};

export default function middleware(req) {
  const url = new URL(req.url);

  // 1. Force HTTPS
  // In Vercel, x-forwarded-proto tells us if the original request was http
  if (req.headers.get('x-forwarded-proto') === 'http' && !url.hostname.includes('localhost')) {
    url.protocol = 'https:';
    return Response.redirect(url, 301);
  }

  // 2. CORS Handling for API routes
  if (url.pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      'https://certifyd.in',
      'https://www.certifyd.in',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);

    const isAllowed = origin && allowedOrigins.includes(origin);
    const allowOrigin = isAllowed ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Prepare response headers for normal API requests
    const res = next();
    Object.entries(corsHeaders).forEach(([key, val]) => res.headers.set(key, val));
    return res;
  }

  // 3. Staging Basic Auth
  // Check if it's the staging branch or your specific vercel domain
  if (url.hostname.includes('staging') || url.hostname.includes('certifyd.vercel.app')) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Use environment variables for staging credentials
      const expectedUser = process.env.STAGING_AUTH_USER || 'admin';
      const expectedPwd = process.env.STAGING_AUTH_PASSWORD;
      if (expectedPwd && user === expectedUser && pwd === expectedPwd) {
        return next(); // Let them through!
      }
    }

    // Trigger the un-hackable browser login prompt
    return new Response('Unauthorized Access', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Certifyd Staging Area"',
      },
    });
  }

  // If it's a production custom domain, just let them through immediately
  return next();
}