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
      'https://certifyd.com',
      'https://www.certifyd.com',
      'https://certifyd.vercel.app'
    ];
    
    // For localhost development, you might want to allow it
    if (url.hostname.includes('localhost')) {
      allowedOrigins.push(`http://localhost:${url.port || '5173'}`);
      allowedOrigins.push('http://localhost:3000');
    }

    // Restrict to allowed origins or specific team project Vercel preview domains
    const isAllowed = origin && (
      allowedOrigins.includes(origin) ||
      /^https:\/\/certifyroi-[a-z0-9]+-tanuj0099s-projects\.vercel\.app$/.test(origin)
    );

    const headers = new Headers();
    if (isAllowed) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
      headers.set('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: isAllowed ? 204 : 403,
        headers,
      });
    }

    // Prepare response headers for normal API requests
    const res = next();
    if (isAllowed) {
      headers.forEach((val, key) => res.headers.set(key, val));
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