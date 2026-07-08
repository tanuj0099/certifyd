import { logger } from './logger.js';

export function validateEnvironment() {
  // During static Next.js build step, avoid crashing if environment variables are not injected yet
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ];

  const missing = required.filter(
    (key) => !process.env[key] || process.env[key].length < 10
  );

  if (missing.length > 0) {
    throw new Error(
      `STARTUP FAILED: Missing or invalid environment variables: ${missing.join(', ')}. Application cannot start safely.`
    );
  }

  // JWT secret must be at least 32 chars
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'STARTUP FAILED: JWT_SECRET is too short. Minimum 32 characters required.'
    );
  }

  logger.info('✓ Environment validation passed');
}
