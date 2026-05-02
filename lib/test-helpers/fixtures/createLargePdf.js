import { absolute, mkdirp, remove } from 'firost';
import { dockerRun } from '../../helper.js';

/**
 * Create a large uncompressed PDF (>1MB)
 * @param {string} fixturesDir - Directory where fixtures are stored
 * @param {string} filename - Name of the PDF file to create
 */
export async function createLargePdf(fixturesDir, filename) {
  console.log(`  Creating ${filename} (large >1MB)...`);

  const tempDir = absolute(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Create a large image (2000x2000px) to ensure >1MB
    const largeImageCommand =
      'magick -size 2000x2000 plasma: /app/output/large.png';
    await dockerRun(largeImageCommand, { outputDirectory: tempDir });

    // Convert to PDF
    const convertCommand = `magick /app/input/large.png /app/output/${filename}`;
    await dockerRun(convertCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir,
    });

    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}
