import { absolute, gitRoot, mkdirp, remove, write } from 'firost';
import { dockerRun } from '../../helper.js';
import { normalizePdf } from './normalizePdf.js';

/**
 * Create a PDF with extractable text
 * @param {string} fixturesDir - Directory where fixtures are stored
 * @param {string} filename - Name of the PDF file to create
 */
export async function createPdfWithText(fixturesDir, filename) {
  console.log(`  Creating ${filename} (with text)...`);

  // Use ./tmp at repository root for temporary files
  const tempDir = absolute(gitRoot(), 'tmp/fixtures-generate');
  await mkdirp(tempDir);

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

  const filepath = absolute(fixturesDir, filename);

  const command = `weasyprint /app/input/text.html /app/output/${filename}`;
  await dockerRun(command, {
    inputDirectory: tempDir,
    outputDirectory: fixturesDir,
    env: {
      // Ensures deterministic builds
      // See: https://github.com/Kozea/WeasyPrint/issues/1553
      SOURCE_DATE_EPOCH: '0',
    },
  });

  await normalizePdf(filepath, fixturesDir);

  await remove(tempDir);
}
