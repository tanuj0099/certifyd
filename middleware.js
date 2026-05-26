export const config = {
  // Only run this middleware on your staging branch URL
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export default function middleware(req) {
  // Check if the URL is your staging URL
  const url = new URL(req.url);
  if (url.hostname.includes('staging') || url.hostname === 'certifyroi.vercel.app') {
    
    // Check for Basic Auth headers
    const basicAuth = req.headers.get('authorization');
    const url = req.url;

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Change 'admin' and 'securepassword123' to whatever you want
      if (user === 'admin' && pwd === 'hakunamatata') {
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }
    }

    // If no auth or wrong password, trigger the browser's native login popup
    return new Response('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Staging Area"',
      },
    });
  }
}
