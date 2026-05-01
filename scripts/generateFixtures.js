#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists, mkdirp, remove } from 'firost';
import { dockerRun } from '../lib/helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, '../fixtures');

/**
 * Generate test fixtures for Pietro tests
 *
 * This script creates minimal, well-documented PDF fixtures using ImageMagick's
 * convert command via Docker to generate perfectly valid PDFs.
 *
 * Fixtures created:
 * - test-simple.pdf: 1 page with basic text
 * - test-multi-3pages.pdf: 3 pages with text on each page
 * - test-multi-5pages.pdf: 5 pages with text on each page
 */

async function generateFixtures() {
  console.log('🔨 Generating test fixtures...');
  await mkdirp(fixturesDir);

  // Create clean PDFs using ImageMagick convert
  // This produces perfectly valid PDFs without warnings

  await createPdfWithImageMagick('test-simple.pdf', 1);
  await createPdfWithImageMagick('test-multi-3pages.pdf', 3);
  await createPdfWithImageMagick('test-multi-5pages.pdf', 5);

  console.log('✅ Fixtures generated successfully!');
  console.log('\nVerifying fixtures with qpdf...');

  // Verify each fixture
  for (const fixture of ['test-simple.pdf', 'test-multi-3pages.pdf', 'test-multi-5pages.pdf']) {
    await verifyFixture(fixture);
  }
}

/**
 * Create a clean PDF with specified number of pages using ImageMagick
 * ImageMagick's convert produces perfectly valid PDFs
 * We create simple white pages without text to avoid font issues
 */
async function createPdfWithImageMagick(filename, pageCount) {
  console.log(`  Creating ${filename} (${pageCount} page${pageCount > 1 ? 's' : ''})...`);

  const tempDir = path.join(fixturesDir, '.tmp-generate');
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
    const inputFiles = pageFiles.map(f => `/app/input/${f}`).join(' ');
    const convertCommand = `magick ${inputFiles} /app/output/${filename}`;

    await dockerRun(convertCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir
    });

    // Cleanup temp files
    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}

/**
 * Verify a fixture using qpdf via Docker
 */
async function verifyFixture(filename) {
  const fixturePath = path.join(fixturesDir, filename);

  if (!(await exists(fixturePath))) {
    console.error(`  ❌ ${filename} not found`);
    return;
  }

  try {
    const command = `qpdf --check /app/input/${filename}`;
    const result = await dockerRun(command, { inputDirectory: fixturesDir });

    // Get page count
    const countCommand = `qpdf --show-npages /app/input/${filename}`;
    const countResult = await dockerRun(countCommand, { inputDirectory: fixturesDir });
    const pages = parseInt(countResult.stdout.trim());

    console.log(`  ✅ ${filename}: ${pages} page${pages > 1 ? 's' : ''}, valid PDF`);
  } catch (error) {
    console.error(`  ❌ ${filename}: verification failed`);
    console.error(error.message);
  }
}

// Run the script
generateFixtures().catch(error => {
  console.error('❌ Error generating fixtures:', error);
  process.exit(1);
});
