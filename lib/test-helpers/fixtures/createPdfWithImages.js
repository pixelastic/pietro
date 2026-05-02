import { absolute, mkdirp, remove } from 'firost';
import { dockerRun } from '../../helper.js';

/**
 * Create a PDF with 100x100px images
 * @param {string} fixturesDir - Directory where fixtures are stored
 * @param {string} filename - Name of the PDF file to create
 */
export async function createPdfWithImages(fixturesDir, filename) {
  console.log(`  Creating ${filename} (with images)...`);

  const tempDir = absolute(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Create two 100x100px colored images
    const img1Command = 'magick -size 100x100 xc:red /app/output/img1.png';
    await dockerRun(img1Command, { outputDirectory: tempDir });

    const img2Command = 'magick -size 100x100 xc:blue /app/output/img2.png';
    await dockerRun(img2Command, { outputDirectory: tempDir });

    // Combine images into PDF
    const convertCommand = `magick /app/input/img1.png /app/input/img2.png /app/output/${filename}`;
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
