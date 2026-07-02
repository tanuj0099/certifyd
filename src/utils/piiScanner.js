/**
 * Defense in Depth - Layer 3: Automated PII Scanner
 * 
 * This utility runs on AI-extracted data right before it touches the database.
 * If the AI hallucinates or ignores the system prompt and leaks PII, this acts
 * as a hard architectural constraint that scrubs it.
 */

const PII_PATTERNS = [
  // Email pattern
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // PAN Card pattern (India specific) - 5 Letters, 4 Digits, 1 Letter
  /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
  // Aadhaar Number (India specific) - 12 digits, optional spaces/hyphens
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // Phone numbers (Indian mobile +91/0 or international format starting with +)
  /(?:\+91[\s-]?)?[0]?[6-9]\d{9}\b|\b\+\d{1,3}[\s-]?\d{8,11}\b/g,
];

/**
 * Scans a string or JSON object for PII patterns and redacts them.
 * @param {any} data - The data payload to scan (string, object, array)
 * @returns {any} - The scrubbed payload
 */
export function scanAndScrubPII(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    let scrubbed = data;
    for (const pattern of PII_PATTERNS) {
      scrubbed = scrubbed.replace(pattern, '[REDACTED_PII]');
    }
    return scrubbed;
  }

  if (Array.isArray(data)) {
    return data.map(item => scanAndScrubPII(item));
  }

  if (typeof data === 'object') {
    const scrubbedObj = {};
    for (const [key, value] of Object.entries(data)) {
      // If the key itself looks like an email or PAN, skip or redact it, but usually values are the problem.
      scrubbedObj[key] = scanAndScrubPII(value);
    }
    return scrubbedObj;
  }

  // Numbers, booleans, etc., are returned as-is
  return data;
}

/**
 * Validates whether a payload contains PII. Use this if you want to completely reject the payload instead of scrubbing.
 * @param {string} text - Stringified payload
 * @returns {boolean} - true if PII is detected
 */
export function containsPII(text) {
  if (!text || typeof text !== 'string') return false;
  
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      return true; // PII detected
    }
  }
  return false;
}
