import { absolute, mkdirp, remove } from 'firost';
import { dockerRun } from '../../helper.js';

/**
 * Create a clean PDF with specified number of pages using ImageMagick
 * ImageMagick's convert produces perfectly valid PDFs
 * We create simple white pages without text to avoid font issues
 * @param {string} fixturesDir - Directory where fixtures are stored
 * @param {string} filename - Name of the PDF file to create
 * @param {number} pageCount - Number of pages to create
 */
export async function createPdfWithImageMagick(
  fixturesDir,
  filename,
  pageCount,
) {
  console.log(
    `  Creating ${filename} (${pageCount} page${pageCount > 1 ? 's' : ''})...`,
  );

  const tempDir = absolute(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Generate individual blank page images, then combine into PDF
    const pageFiles = [];

    for (let i = 0; i < pageCount; i++) {
      const pageNum = i + 1;
      const pageFile = `page-${pageNum}.png`;

      // Create a simple white blank image
      const command = `magick -size 612x792 xc:white /app/output/${pageFile}`;

      await dockerRun(command, { outputDirectory: tempDir });
      pageFiles.push(pageFile);
    }

    // Convert all PNG pages to a single PDF
    const inputFiles = pageFiles.map((f) => `/app/input/${f}`).join(' ');
    const convertCommand = `magick ${inputFiles} /app/output/${filename}`;

    await dockerRun(convertCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir,
    });

    // Cleanup temp files
    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}
