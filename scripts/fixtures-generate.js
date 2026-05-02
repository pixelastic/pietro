import { absolute, gitRoot } from 'firost';
import { createLargePdf } from '../lib/test-helpers/fixtures/createLargePdf.js';
import { createPdfWithImageMagick } from '../lib/test-helpers/fixtures/createPdfWithImageMagick.js';
import { createPdfWithImages } from '../lib/test-helpers/fixtures/createPdfWithImages.js';
import { createPdfWithText } from '../lib/test-helpers/fixtures/createPdfWithText.js';

const fixturesDir = absolute(gitRoot(), 'fixtures');

await createPdfWithImageMagick(fixturesDir, 'test-simple.pdf', 1);
await createPdfWithImageMagick(fixturesDir, 'test-multi-3pages.pdf', 3);
await createPdfWithImageMagick(fixturesDir, 'test-multi-5pages.pdf', 5);
await createPdfWithText(fixturesDir, 'test-with-text.pdf');
await createPdfWithImages(fixturesDir, 'test-with-images.pdf');
await createLargePdf(fixturesDir, 'test-large.pdf');
