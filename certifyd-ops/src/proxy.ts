import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-for-local-dev-only-change-in-prod-64-chars';
const key = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets, API routes, and favicon bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow unrestricted access to the login route right at the entry point
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // LAYER 1: Cloudflare Access Email Header Verification (if configured)
  const allowedEmailsStr = process.env.ALLOWED_EMAILS;
  if (allowedEmailsStr && allowedEmailsStr.trim() !== '') {
    const allowedEmails = allowedEmailsStr.split(',').map((e) => e.trim().toLowerCase());
    let cfEmail = (
      req.headers.get('cf-access-authenticated-user-email') ||
      req.headers.get('x-mock-cf-email') ||
      ''
    ).toLowerCase().trim();

    // In local development, if no Cloudflare Zero-Trust header is present, fall back to dev email
    if (!cfEmail && (process.env.NODE_ENV === 'development' || req.nextUrl.hostname === 'localhost' || req.nextUrl.hostname === '127.0.0.1')) {
      cfEmail = allowedEmails[0] || 'admin@certifyd.in';
    }

    if (!cfEmail || !allowedEmails.includes(cfEmail)) {
      return new NextResponse(
        JSON.stringify({ error: '403 Forbidden - Cloudflare Access Layer Authentication Failed or Email Not Allowed' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // LAYER 2: Check App-Level JWT Session
  const sessionCookie = req.cookies.get('admin_session')?.value;
  if (!sessionCookie) {
    // Check IP Allowlist before redirecting unauthenticated traffic
    const allowedIpsStr = process.env.ALLOWED_IPS;
    if (allowedIpsStr && allowedIpsStr.trim() !== '') {
      const allowedIps = allowedIpsStr.split(',').map((ip) => ip.trim());
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
      const firstIp = clientIp.split(',')[0].trim();
      if (!allowedIps.includes(firstIp) && !allowedIps.includes('*')) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - IP Address Not in Allowlist' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(sessionCookie, key, {
      algorithms: ['HS256'],
    });

    const role = payload.role as string;

    // LAYER 3: Role-Based Access Protection for /system and granular routes
    if (pathname.startsWith('/system') && !pathname.startsWith('/system/settings') && role !== 'SUPER_ADMIN') {
      const permissions = payload.permissions as any;
      const isAuditRoute = pathname.startsWith('/system/audit');
      if (isAuditRoute) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - SUPER_ADMIN privileges required for Audit Log' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
      if (!permissions || permissions.access_technical !== true) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - Technical privileges required for system control routes' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    if (pathname.startsWith('/marketing') && role !== 'SUPER_ADMIN') {
      const permissions = payload.permissions as any;
      if (!permissions || permissions.access_marketing !== true) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - Marketing privileges required for this section' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    if (pathname.startsWith('/submissions') && role !== 'SUPER_ADMIN') {
      const permissions = payload.permissions as any;
      if (!permissions || permissions.access_verifications !== true) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - Verifications privileges required for submissions' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    if (pathname.startsWith('/data') && role !== 'SUPER_ADMIN') {
      const permissions = payload.permissions as any;
      if (!permissions || permissions.access_database !== true) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - Database privileges required for data management' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    if (pathname.startsWith('/content') && role !== 'SUPER_ADMIN') {
      const permissions = payload.permissions as any;
      if (!permissions || permissions.access_content !== true) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - Content privileges required for content management' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    if (pathname.startsWith('/ops/team') && role !== 'SUPER_ADMIN') {
      const permissions = payload.permissions as any;
      if (!permissions || permissions.access_admin !== true) {
        return new NextResponse(
          JSON.stringify({ error: '403 Forbidden - Admin privileges required for Team Access' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // Attach role header for downstream layout/server actions
    const res = NextResponse.next();
    res.headers.set('x-user-role', role);
    res.headers.set('x-user-email', (payload.email as string) || '');
    return res;
  } catch {
    // Cookie invalid or expired
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('admin_session');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
