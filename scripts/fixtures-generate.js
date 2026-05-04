import { createEmptyPdf } from '../lib/test-helpers/fixtures/createEmptyPdf.js';
import { createLargePdf } from '../lib/test-helpers/fixtures/createLargePdf.js';
import { createPdfWithImages } from '../lib/test-helpers/fixtures/createPdfWithImages.js';
import { createPdfWithText } from '../lib/test-helpers/fixtures/createPdfWithText.js';

await createEmptyPdf('test-simple.pdf', 1);
await createEmptyPdf('test-multi-3pages.pdf', 3);
await createEmptyPdf('test-multi-5pages.pdf', 5);
await createPdfWithText('test-with-text.pdf');
await createPdfWithImages('test-with-images.pdf');
await createLargePdf('test-large.pdf');
