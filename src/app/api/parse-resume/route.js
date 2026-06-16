import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
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
