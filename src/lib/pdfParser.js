export async function extractPdfText(buffer) {
  // Load the Node-only package inside the request handler. Keeping this out of
  // module initialization avoids serverless cold-start failures if the runtime
  // resolves external packages from the deployed function bundle.
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
