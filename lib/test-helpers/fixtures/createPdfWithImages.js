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
    // Use pdf: prefix to ensure ImageMagick creates a PDF even with .tmp extension
    const tempFilename = `${filename}.tmp`;
    const convertCommand = `magick /app/input/img1.png /app/input/img2.png pdf:/app/output/${tempFilename}`;
    await dockerRun(convertCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir,
    });

    // Normalize metadata for deterministic builds
    const normalizeMetadataCommand = `exiftool -Title='test' -CreateDate='2000:01:01 00:00:00' -ModifyDate='2000:01:01 00:00:00' -overwrite_original /app/input/${tempFilename}`;
    await dockerRun(normalizeMetadataCommand, {
      inputDirectory: fixturesDir,
      stderr: false,
      stdout: false,
    });

    // Normalize PDF structure and ID for deterministic output
    const normalizePdfCommand = `qpdf --deterministic-id /app/input/${tempFilename} /app/output/${filename}`;
    await dockerRun(normalizePdfCommand, {
      inputDirectory: fixturesDir,
      outputDirectory: fixturesDir,
    });

    // Cleanup
    await remove(absolute(fixturesDir, tempFilename));
    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}
