import path from 'node:path';
import os from 'node:os';
import { copyFile, exists, mkdirp, remove, write } from 'firost';
import { ensureImageIsAvailable } from '../helper.js';

/**
 * Create a unique temporary directory for test isolation
 * @returns {Promise<string>} Path to the temporary directory
 */
export async function createTempDir() {
  const tmpBase = path.join(os.tmpdir(), 'pietro-tests');
  await mkdirp(tmpBase);

  const uniqueId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const tmpDir = path.join(tmpBase, uniqueId);
  await mkdirp(tmpDir);

  return tmpDir;
}

/**
 * Clean up a temporary directory
 * @param {string} dir Path to the directory to remove
 * @returns {Promise<void>}
 */
export async function cleanup(dir) {
  if (await exists(dir)) {
    await remove(dir);
  }
}

/**
 * Copy a fixture file to a destination directory
 * @param {string} fixtureName Name of the fixture file (e.g., 'foo.pdf')
 * @param {string} destDir Destination directory path
 * @returns {Promise<string>} Path to the copied file
 */
export async function copyFixture(fixtureName, destDir) {
  const fixturesDir = path.join(process.cwd(), 'fixtures');
  const sourcePath = path.join(fixturesDir, fixtureName);

  if (!(await exists(sourcePath))) {
    throw new Error(`Fixture ${fixtureName} does not exist at ${sourcePath}`);
  }

  await mkdirp(destDir);
  const destPath = path.join(destDir, fixtureName);
  await copyFile(sourcePath, destPath);

  return destPath;
}

/**
 * Ensure Docker image is ready before running tests
 * This should be called once in beforeAll hooks
 * @returns {Promise<void>}
 */
export async function ensureDockerReady() {
  await ensureImageIsAvailable();
}

/**
 * Create a simple test PDF file with specified number of pages
 * Useful for generating test fixtures on the fly
 * @param {string} outputPath Path where to save the PDF
 * @param {number} pageCount Number of pages to create
 * @param {string} content Text content for each page
 * @returns {Promise<void>}
 */
export async function createSimplePdf(outputPath, pageCount = 1, content = 'Test page') {
  // This is a minimal valid PDF structure
  // Each page is identical with basic text
  const pages = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push(`
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(${content} ${i + 1}) Tj
ET
endstream
endobj`);
  }

  const pagesRefs = pages.map((_, i) => `${5 + i} 0 R`).join(' ');

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count ${pageCount} >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents [${pagesRefs}] >>
endobj

4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj

${pages.join('\n\n')}

xref
0 ${6 + pageCount}
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000127 00000 n
0000000245 00000 n
${pages.map((page, i) => {
  const offset = pdf.indexOf(`5 0 obj`);
  return String(offset).padStart(10, '0') + ' 00000 n';
})[0]}
trailer
<< /Size ${6 + pageCount} /Root 1 0 R >>
startxref
${pdf.length + 50}
%%EOF`;

  await write(pdf, outputPath);
}
