import { fileTypeFromBuffer } from 'file-type';
import { logger } from './logger.js';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function validateUploadedFile(buffer, claimedMimeType) {
  // Check file size first (max 5MB for documents)
  if (buffer.length > 5 * 1024 * 1024) {
    logger.warn('File upload rejected: too large', { size: buffer.length });
    return {
      valid: false,
      reason: 'File too large. Maximum 5MB.',
    };
  }

  // Detect actual file type from bytes
  const detected = await fileTypeFromBuffer(buffer);

  // For plain text files, file-type returns undefined
  // (text has no magic bytes) — handle separately
  if (!detected) {
    if (claimedMimeType === 'text/plain') {
      const text = buffer.toString('utf-8');
      const hasScript = /<script|<svg|<html|javascript:/i.test(text);
      if (hasScript) {
        logger.warn('File upload rejected: script/html content detected in plain text file');
        return {
          valid: false,
          reason: 'Invalid file content.',
        };
      }
      return { valid: true };
    }
    logger.warn('File upload rejected: unrecognized file type bytes', { claimedMimeType });
    return {
      valid: false,
      reason: 'Unrecognized file type.',
    };
  }

  // Check detected type against allowlist
  if (!ALLOWED_TYPES.includes(detected.mime)) {
    logger.warn('File upload rejected: disallowed MIME type', { detectedMime: detected.mime });
    return {
      valid: false,
      reason: `File type ${detected.mime} not allowed.`,
    };
  }

  // Check for MIME type mismatch (bypass attempt)
  if (
    detected.mime !== claimedMimeType &&
    claimedMimeType !== 'application/octet-stream'
  ) {
    logger.warn('File upload rejected: MIME type mismatch', {
      detectedMime: detected.mime,
      claimedMimeType,
    });
    return {
      valid: false,
      reason: 'File type mismatch detected.',
    };
  }

  return { valid: true };
}
