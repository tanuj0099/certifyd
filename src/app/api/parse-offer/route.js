import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import * as Sentry from '@sentry/nextjs';
import { offerSubmissionLimiter } from '@/lib/ratelimit.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = Sentry.wrapRouteHandlerWithSentry(async (request) => {
  try {
    if (offerSubmissionLimiter) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'anonymous';
      const { success, limit, remaining, reset } = await offerSubmissionLimiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded for PDF processing. Try again later.', retryAfter: Math.ceil((reset - Date.now()) / 1000) },
          { status: 429, headers: { 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(remaining), 'X-RateLimit-Reset': String(reset) } }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Size Validation (4MB limit)
    if (data.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max size is 4MB.' }, { status: 413 });
    }

    // Magic Bytes Validation for PDF (%PDF- at the start)
    if (data.length < 5 || String.fromCharCode(...data.subarray(0, 5)) !== '%PDF-') {
      return NextResponse.json({ error: 'Invalid file format. Only PDFs are allowed.' }, { status: 400 });
    }

    // Parse the PDF text entirely in memory using unpdf (secure against Prototype Pollution / Arbitrary Code Execution)
    const { text } = await extractText(data);
    const parsedText = Array.isArray(text) ? text.join('\n').trim() : String(text).trim();

    return NextResponse.json({ text: parsedText });
  } catch (error) {
    Sentry.captureException(error);
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file.', details: error.message },
      { status: 500 }
    );
  }
});
