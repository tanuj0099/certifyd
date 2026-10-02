import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { rateLimiters, getRateLimitId, applyRateLimit } from '@/lib/ratelimit.js';
import { validateUploadedFile } from '@/lib/fileValidation.js';
import { logger } from '@/lib/logger.js';
import { extractPdfText } from '@/lib/pdfParser.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const id = getRateLimitId(request);
    const { limited, response } = await applyRateLimit(rateLimiters.offerLetter, id);
    if (limited) return response;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deep server-side file validation
    const validation = await validateUploadedFile(buffer, file.type || 'application/pdf');
    if (!validation.valid) {
      logger.warn('Offer letter upload rejected', { reason: validation.reason });
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // Parse the PDF text entirely in memory.
    const parsedText = await extractPdfText(buffer);

    return NextResponse.json({ text: parsedText });
  } catch (error) {
    Sentry.captureException(error);
    logger.error('PDF parsing error', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file.', details: error.message },
      { status: 500 }
    );
  }
}
