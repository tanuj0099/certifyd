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
      'https://certifyd.com',
      'https://www.certifyd.com',
      'https://certifyd.vercel.app'
    ];
    
    // For localhost development, you might want to allow it
    if (url.hostname.includes('localhost')) {
      allowedOrigins.push(`http://localhost:${url.port || '5173'}`);
    }

    const isAllowed = allowedOrigins.includes(origin) || origin?.endsWith('.vercel.app');

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Prepare response headers for normal API requests
    const res = next();
    if (isAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      res.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    return res;
  }

  // 3. Staging Basic Auth
  // Check if it's the staging branch or your specific vercel domain
  if (url.hostname.includes('staging') || url.hostname.includes('certifyd.vercel.app')) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Change your credentials here!
      if (user === 'admin' && pwd === 'hakunamatata') {
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