import { absolute, mkdirp, remove, write } from 'firost';
import { dockerRun } from '../../helper.js';

/**
 * Create a PDF with extractable text
 * @param {string} fixturesDir - Directory where fixtures are stored
 * @param {string} filename - Name of the PDF file to create
 */
export async function createPdfWithText(fixturesDir, filename) {
  console.log(`  Creating ${filename} (with text)...`);

  const tempDir = absolute(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Create HTML with the text content
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {
  font-family: DejaVu Sans, sans-serif;
  font-size: 14pt;
  padding: 2cm;
}
</style>
</head>
<body>
<p>You can cut our wings, but we will always remember what it was like to fly.</p>
</body>
</html>`;

    const htmlFile = absolute(tempDir, 'text.html');
    await write(htmlContent, htmlFile);

    // Convert HTML to PDF using weasyprint
    const tempFilename = `${filename}.tmp`;
    const command = `weasyprint /app/input/text.html /app/output/${tempFilename}`;
    await dockerRun(command, {
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
