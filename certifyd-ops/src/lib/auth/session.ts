import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-for-local-dev-only-change-in-prod-64-chars';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  email: string;
  role: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  expiresAt: number;
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key);
}

export async function decryptSession(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(email: string, role: 'SUPER_ADMIN' | 'TEAM_MEMBER') {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const session = await encryptSession({ email, role, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set('admin_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours in seconds
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session')?.value;
  return decryptSession(sessionCookie);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export function getUserRoleFromEnv(email: string): 'SUPER_ADMIN' | 'TEAM_MEMBER' | null {
  try {
    const adminUsersJson = process.env.ADMIN_USERS;
    if (!adminUsersJson) {
      if (email.toLowerCase() === 'admin@certifyd.in' || email.toLowerCase() === 'superadmin@certifyd.in' || email.toLowerCase() === process.env.ADMIN_USERNAME?.toLowerCase()) return 'SUPER_ADMIN';
      if (email.toLowerCase() === 'team@certifyd.in') return 'TEAM_MEMBER';
      return null;
    }
    const users: { email: string; role: string }[] = JSON.parse(adminUsersJson);
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found && (found.role === 'SUPER_ADMIN' || found.role === 'TEAM_MEMBER')) {
      return found.role as 'SUPER_ADMIN' | 'TEAM_MEMBER';
    }
    return null;
  } catch (e) {
    console.error('Error parsing ADMIN_USERS env var:', e);
    return null;
  }
}
