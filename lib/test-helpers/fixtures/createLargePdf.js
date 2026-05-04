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
    // Use gradient instead of plasma: for deterministic output
    const largeImageCommand =
      'magick -size 2000x2000 gradient:blue-red /app/output/large.png';
    await dockerRun(largeImageCommand, { outputDirectory: tempDir });

    // Convert to PDF
    // Use pdf: prefix to ensure ImageMagick creates a PDF even with .tmp extension
    const tempFilename = `${filename}.tmp`;
    const convertCommand = `magick /app/input/large.png pdf:/app/output/${tempFilename}`;
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
