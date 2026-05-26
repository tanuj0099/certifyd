import { next } from '@vercel/edge';

export const config = {
  // Matches all routes except static assets
  matcher: ['/((?!assets|vite.svg|favicon.ico).*)'],
};

export default function middleware(req) {
  const url = new URL(req.url);

  // Check if it's the staging branch or your specific vercel domain
  if (url.hostname.includes('staging') || url.hostname.includes('certifyroi.vercel.app')) {
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
        'WWW-Authenticate': 'Basic realm="CertifyROI Staging Area"',
      },
    });
  }

  // If it's a production custom domain, just let them through immediately
  return next();
}