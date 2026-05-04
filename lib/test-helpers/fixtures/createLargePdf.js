import { absolute } from 'firost';
import { dockerRun } from '../../helper.js';
import { normalizePdf } from './normalizePdf.js';

/**
 * Create a large uncompressed PDF (>1MB)
 * @param {string} fixturesDir - Directory where fixtures are stored
 * @param {string} filename - Name of the PDF file to create
 */
export async function createLargePdf(fixturesDir, filename) {
  console.log(`  Creating ${filename} (large >1MB)...`);

  const filepath = absolute(fixturesDir, filename);

  // Generate large PDF (>1MB) directly with gradient
  const createCommand = `magick -size 2000x2000 gradient:blue-red /app/output/${filename}`;
  await dockerRun(createCommand, { outputDirectory: fixturesDir });

  await normalizePdf(filepath, fixturesDir);
}
