import { absolute, consoleInfo } from 'firost';
import { dockerRun } from '../helper.js';
import { FIXTURES_DIR } from './fixturesDir.js';
import { normalizePdf } from './normalizePdf.js';

/**
 * Create a large uncompressed PDF (>1MB)
 * @param {string} filename - Name of the PDF file to create (e.g., 'test-large.pdf')
 */
export async function createLargePdf(filename) {
  consoleInfo(`Creating ${filename}...`);

  const filepath = absolute(FIXTURES_DIR, filename);

  // Generate large PDF (>1MB) directly with gradient
  const createCommand = `magick -size 2000x2000 gradient:blue-red /app/output/${filename}`;
  await dockerRun(createCommand, { outputDirectory: FIXTURES_DIR });

  await normalizePdf(filepath, FIXTURES_DIR);
}
