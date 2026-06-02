import { NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export const dynamic = 'force-dynamic';

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

    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      text += pageText + '\n';
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file.', details: error.message },
      { status: 500 }
    );
  }
}
