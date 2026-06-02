import { NextResponse } from 'next/server';

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

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableWorker: true,
      useSystemFonts: true,
    });
    const pdfDocument = await loadingTask.promise;
    const pageTexts = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => item.str || '').join(' '));
      page.cleanup();
    }

    await pdfDocument.destroy();

    return NextResponse.json({ text: pageTexts.join('\n\n').trim() });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file.', details: error.message },
      { status: 500 }
    );
  }
}
