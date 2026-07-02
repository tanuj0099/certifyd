import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export function logRequest(req, extra = {}) {
  const method = req.method || 'GET';
  const url = req.url || req.nextUrl?.pathname || '';
  const ip =
    typeof req.headers?.get === 'function'
      ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anonymous'
      : req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.headers?.['x-real-ip'] || 'anonymous';

  logger.info({
    method,
    url,
    ip,
    ...extra,
  }, `HTTP ${method} ${url}`);
}
