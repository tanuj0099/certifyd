import { NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Disable workers for Node.js environments
pdfjs.GlobalWorkerOptions.workerSrc = false;

export async function POST(request) {
  try {
    const arrayBuffer = await request.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

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
