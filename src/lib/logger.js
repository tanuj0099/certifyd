const SENSITIVE_KEYS = new Set([
  'email',
  'mail',
  'password',
  'pwd',
  'token',
  'secret',
  'authorization',
  'cookie',
  'ip',
  'x-forwarded-for',
  'user-agent',
  'phone',
  'phonenumber',
  'mobile',
  'contact',
  'name',
  'fullname',
  'address',
  'dob',
  'dateofbirth',
  'pan',
  'aadhaar',
  'card',
  'cvv',
  'ssn'
]);

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
  /(?:\+91[\s-]?)?[0]?[6-9]\d{9}\b|\b\+\d{1,3}[\s-]?\d{8,11}\b/g,
];

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  let result = str;
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

function sanitize(data, depth = 0) {
  if (depth > 10 || data === null || data === undefined) return data;
  if (typeof data === 'string') return sanitizeString(data);
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(keyLower)) {
      sanitized[key] = '[REDACTED]';
    } else if ((key === 'userId' || key === 'user_id' || key === 'id') && typeof value === 'string') {
      sanitized[key] = value.length > 8 ? value.substring(0, 8) + '...' : value;
    } else {
      sanitized[key] = sanitize(value, depth + 1);
    }
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
