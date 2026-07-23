import { NextResponse } from 'next/server';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { rateLimiters, getRateLimitId, applyRateLimit } from '@/lib/ratelimit.js';
import { validateUploadedFile } from '@/lib/fileValidation.js';
import { logger } from '@/lib/logger.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const id = getRateLimitId(request);
    const { limited, response } = await applyRateLimit(rateLimiters.resumeAnalysis, id);
    if (limited) return response;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Secure server-side file validation
    const validation = await validateUploadedFile(buffer, file.type || 'application/pdf');
    if (!validation.valid) {
      logger.warn('Resume upload rejected', { reason: validation.reason });
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    let extractedText = '';

    // Magic Bytes Validation
    const magicBytes = buffer.subarray(0, 5).toString('utf8');
    
    if (magicBytes === '%PDF-') {
      // Parse PDF using pdf-parse
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text.trim();
    } else if (buffer.subarray(0, 4).toString('hex') === '504b0304') {
      // Parse DOCX (ZIP signature PK..)
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json({ error: 'Invalid file format. Only PDF and DOCX are allowed.' }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from file.' }, { status: 400 });
    }

    return NextResponse.json({ text: extractedText.trim() });
  } catch (error) {
    logger.error('File parsing error', error);
    return NextResponse.json(
      { error: 'Failed to parse file.', details: error.message },
      { status: 500 }
    );
  }
}
