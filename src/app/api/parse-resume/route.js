import { NextResponse } from 'next/server';

// Polyfill required by modern pdfjs-dist inside pdf-parse
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {};
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {};
}

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
    const data = new Uint8Array(arrayBuffer);

    // Size Validation (4MB limit)
    if (data.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max size is 4MB.' }, { status: 413 });
    }

    // Magic Bytes Validation for PDF (%PDF- at the start)
    if (data.length < 5 || String.fromCharCode(...data.subarray(0, 5)) !== '%PDF-') {
      return NextResponse.json({ error: 'Invalid file format. Only PDFs are allowed.' }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    
    // Dynamically import pdf-parse AFTER the polyfills have run
    // Depending on how it's bundled/exported, it might be the default export or the module itself
    const pdfModule = await import('pdf-parse');
    const pdf = pdfModule.default || pdfModule;
    
    // Parse the PDF text entirely in memory using pdf-parse
    const parsedData = await pdf(buffer);

    return NextResponse.json({ text: parsedData.text.trim() });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file.', details: error.message },
      { status: 500 }
    );
  }
}
