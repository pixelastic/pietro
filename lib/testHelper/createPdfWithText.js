import { absolute, consoleInfo, remove, write } from 'firost';
import { dockerRun } from '../helper.js';
import { FIXTURES_DIR } from './fixturesDir.js';
import { normalizePdf } from './normalizePdf.js';
import { tmpDirectory } from './tmpDirectory.js';

/**
 * Create a PDF with extractable text
 * @param {string} filename - Name of the PDF file to create (e.g., 'test-with-text.pdf')
 */
export async function createPdfWithText(filename) {
  consoleInfo(`Creating ${filename}...`);

  // Create unique temporary directory in repo's ./tmp
  const tempDir = await tmpDirectory();

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

  const filepath = absolute(FIXTURES_DIR, filename);

  const command = `weasyprint /app/input/text.html /app/output/${filename}`;
  await dockerRun(command, {
    inputDirectory: tempDir,
    outputDirectory: FIXTURES_DIR,
    env: {
      // Ensures deterministic builds
      // See: https://github.com/Kozea/WeasyPrint/issues/1553
      SOURCE_DATE_EPOCH: '0',
    },
  });

  await normalizePdf(filepath, FIXTURES_DIR);

  await remove(tempDir);
}
