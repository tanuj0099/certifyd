if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}

import fs from 'fs';

async function test() {
  try {
    const pdf = await import('pdf-parse');
    console.log("pdf-parse loaded successfully", typeof pdf.default);
  } catch (err) {
    console.error(err);
  }
}
test();
