import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let ratelimit = null;

function getRatelimit() {
  if (ratelimit) return ratelimit;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: false,
  });
  return ratelimit;
}

export async function POST(request) {
  try {
    const rl = getRatelimit();
    if (rl) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'anonymous';
      const { success, limit, remaining, reset } = await rl.limit(`parse_resume_${ip}`);

      if (!success) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Please wait before uploading another resume.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
            },
          }
        );
      }
    }
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Size Validation (4MB limit)
    if (buffer.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max size is 4MB.' }, { status: 413 });
    }

    let extractedText = '';

    // Magic Bytes Validation
    const magicBytes = buffer.subarray(0, 5).toString('utf8');
    
    if (magicBytes === '%PDF-') {
      // Parse PDF
      const parsedData = await pdf(buffer);
      extractedText = parsedData.text;
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
    console.error('File parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse file.', details: error.message },
      { status: 500 }
    );
  }
}
