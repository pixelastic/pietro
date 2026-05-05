import {
  createEmptyPdf,
  createLargePdf,
  createPdfWithImages,
  createPdfWithText,
} from '../lib/testHelper/main.js';

await createEmptyPdf('test-simple.pdf', 1);
await createEmptyPdf('test-multi-3pages.pdf', 3);
await createEmptyPdf('test-multi-5pages.pdf', 5);
await createPdfWithText('test-with-text.pdf');
await createPdfWithImages('test-with-images.pdf');
await createLargePdf('test-large.pdf');
