import { z } from 'zod';

export const schemas = {
  offerLetterText: z
    .string()
    .min(100, 'Too short to be an offer letter')
    .max(50000, 'Document too large'),

  resumeText: z
    .string()
    .min(50, 'Too short to be a resume')
    .max(30000, 'Document too large'),

  cityInput: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z\s,]+$/, 'City names contain only letters'),

  certName: z.string().min(2).max(200),

  userMessage: z.string().max(2000),

  email: z.string().email().max(254),

  password: z.string().min(8).max(128),

  urlField: z
    .string()
    .url()
    .max(2048)
    .startsWith('https://', 'Only HTTPS URLs allowed')
    .refine((url) => !url.includes('javascript:'), 'Invalid URL')
    .optional(),
};

export async function validateBody(request, schema) {
  // Enforce body size limit (1MB max)
  const contentLength = request.headers.get('content-length');

  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      error: new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: result.error.flatten(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { data: result.data };
}
