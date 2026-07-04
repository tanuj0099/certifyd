'use server';

import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSession, deleteSession, getUserRoleFromEnv } from '../lib/auth/session';
import { checkRateLimit, resetRateLimit } from '../lib/auth/rate-limit';
import { logAudit } from '../lib/rbac/permissions';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string) || '';
  const password = (formData.get('password') as string) || '';

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  const cleanIp = ip.split(',')[0].trim();

  // Rate limiting check
  const rateLimit = await checkRateLimit(cleanIp);
  if (!rateLimit.success) {
    return {
      error: rateLimit.reason || 'Too many failed login attempts.',
      lockedUntil: rateLimit.lockedUntil,
    };
  }

  // Validate credentials
  const envUsername = process.env.ADMIN_USERNAME || 'admin@certifyd.in';
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  let isValid = false;
  if (username.toLowerCase() === envUsername.toLowerCase()) {
    if (envHash) {
      isValid = await bcrypt.compare(password, envHash);
    } else {
      // Local dev fallback if ADMIN_PASSWORD_HASH is not configured
      isValid = password === 'admin123' || password === 'secret';
    }
  }

  if (!isValid) {
    await logAudit({
      action_type: 'LOGIN_FAILED',
      target_table: 'auth',
      old_value: { username, ip: cleanIp },
    });
    return {
      error: `Invalid credentials. (${rateLimit.remaining} attempts remaining before IP lockout)`,
    };
  }

  // Success: reset rate limit and determine role
  await resetRateLimit(cleanIp);
  const role = getUserRoleFromEnv(username) || 'SUPER_ADMIN';

  await createSession(username, role);

  await logAudit({
    action_type: 'LOGIN_SUCCESS',
    target_table: 'auth',
    new_value: { username, role, ip: cleanIp },
  });

  redirect('/');
}

export async function logoutAction() {
  await logAudit({
    action_type: 'LOGOUT',
    target_table: 'auth',
  });
  await deleteSession();
  redirect('/login');
}
