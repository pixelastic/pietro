import { absolute, consoleInfo, remove } from 'firost';
import { dockerRun } from '../helper.js';
import { FIXTURES_DIR } from './fixturesDir.js';
import { normalizePdf } from './normalizePdf.js';
import { tmpDirectory } from './tmpDirectory.js';

/**
 * Create a PDF with 100x100px images
 * @param {string} filename - Name of the PDF file to create (e.g., 'test-with-images.pdf')
 */
export async function createPdfWithImages(filename) {
  consoleInfo(`Creating ${filename}...`);

  // Create unique temporary directory in repo's ./tmp
  const tempDir = await tmpDirectory();

  // Create two 100x100px colored images
  const img1Command = 'magick -size 100x100 xc:red /app/output/img1.png';
  await dockerRun(img1Command, { outputDirectory: tempDir });

  const img2Command = 'magick -size 100x100 xc:blue /app/output/img2.png';
  await dockerRun(img2Command, { outputDirectory: tempDir });

  // Combine images into PDF
  const filepath = absolute(FIXTURES_DIR, filename);

  const convertCommand = `magick /app/input/img1.png /app/input/img2.png /app/output/${filename}`;
  await dockerRun(convertCommand, {
    inputDirectory: tempDir,
    outputDirectory: FIXTURES_DIR,
  });

  // Normalize PDF for deterministic builds
  await normalizePdf(filepath, FIXTURES_DIR);

  await remove(tempDir);
}
