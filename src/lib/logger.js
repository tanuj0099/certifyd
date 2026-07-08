function sanitize(data) {
  if (typeof data !== 'object' || !data) return data;

  const obj = data;
  const sanitized = { ...obj };

  const sensitiveKeys = [
    'email',
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'ip',
    'x-forwarded-for',
    'user-agent',
  ];

  sensitiveKeys.forEach((key) => {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  });

  if ('userId' in sanitized && typeof sanitized.userId === 'string') {
    sanitized.userId = sanitized.userId.substring(0, 8) + '...';
  }

  return sanitized;
}

export const logger = {
  info: (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data ? sanitize(data) : '');
    }
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data ? sanitize(data) : '');
  },
  error: (message, error) => {
    console.error(
      `[ERROR] ${message}`,
      error instanceof Error ? error.message : sanitize(error)
    );
  },
};
