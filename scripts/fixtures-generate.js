import { pMap } from 'golgoth';
import { absolute, exists, gitRoot, mkdirp, remove, write } from 'firost';
import { dockerRun } from '../lib/helper.js';

const fixturesDir = absolute(gitRoot(), 'fixtures');

/**
 * Generate test fixtures for Pietro tests
 *
 * This script creates minimal, well-documented PDF fixtures using ImageMagick's
 * convert command via Docker to generate perfectly valid PDFs.
 *
 * Fixtures created:
 * - test-simple.pdf: 1 blank page
 * - test-multi-3pages.pdf: 3 blank pages
 * - test-multi-5pages.pdf: 5 blank pages
 * - test-with-text.pdf: PDF with extractable text
 * - test-with-images.pdf: PDF with 100x100px images
 * - test-large.pdf: Uncompressed PDF >1MB
 */

/**
 *
 */
async function generateFixtures() {
  console.log('🔨 Generating test fixtures...');
  await mkdirp(fixturesDir);

  await createPdfWithImageMagick('test-simple.pdf', 1);
  await verifyFixture('test-simple.pdf');

  await createPdfWithImageMagick('test-multi-3pages.pdf', 3);
  await verifyFixture('test-multi-3pages.pdf');

  await createPdfWithImageMagick('test-multi-5pages.pdf', 5);
  await verifyFixture('test-multi-5pages.pdf');

  await createPdfWithText('test-with-text.pdf');
  await verifyFixture('test-with-text.pdf');

  await createPdfWithImages('test-with-images.pdf');
  await verifyFixture('test-with-images.pdf');

  await createLargePdf('test-large.pdf');
  await verifyFixture('test-large.pdf');

  console.log('✅ All fixtures generated and verified successfully!');
}

/**
 * Create a clean PDF with specified number of pages using ImageMagick
 * ImageMagick's convert produces perfectly valid PDFs
 * We create simple white pages without text to avoid font issues
 * @param {string} filename - Name of the PDF file to create
 * @param {number} pageCount - Number of pages to create
 */
async function createPdfWithImageMagick(filename, pageCount) {
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

/**
 * Create a PDF with extractable text
 * @param {string} filename - Name of the PDF file to create
 */
async function createPdfWithText(filename) {
  console.log(`  Creating ${filename} (with text)...`);

  const tempDir = absolute(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Step 1: Create an image with the text rendered using ImageMagick
    const imageCommand = `magick -size 612x792 -background white -fill black -font DejaVu-Sans -pointsize 20 -gravity center caption:"You can cut our wings, but we will always remember what it was like to fly." /app/output/text-image.png`;
    await dockerRun(imageCommand, { outputDirectory: tempDir });

    // Step 2: Use ocrmypdf to OCR the image and create a PDF with searchable text
    const ocrCommand = `ocrmypdf --image-dpi 72 /app/input/text-image.png /app/output/${filename}`;
    await dockerRun(ocrCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir,
    });

    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}

/**
 * Create a PDF with 100x100px images
 * @param {string} filename - Name of the PDF file to create
 */
async function createPdfWithImages(filename) {
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

/**
 * Create a large uncompressed PDF (>1MB)
 * @param {string} filename - Name of the PDF file to create
 */
async function createLargePdf(filename) {
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

/**
 * Verify a fixture using qpdf via Docker
 * @param {string} filename - Name of the PDF file to verify
 */
async function verifyFixture(filename) {
  const fixturePath = absolute(fixturesDir, filename);

  if (!(await exists(fixturePath))) {
    console.error(`  ❌ ${filename} not found`);
    return;
  }

  try {
    const command = `qpdf --check /app/input/${filename}`;
    const result = await dockerRun(command, { inputDirectory: fixturesDir });

    // Get page count
    const countCommand = `qpdf --show-npages /app/input/${filename}`;
    const countResult = await dockerRun(countCommand, {
      inputDirectory: fixturesDir,
    });
    const pages = parseInt(countResult.stdout.trim());

    console.log(
      `  ✅ ${filename}: ${pages} page${pages > 1 ? 's' : ''}, valid PDF`,
    );
  } catch (error) {
    console.error(`  ❌ ${filename}: verification failed`);
    console.error(error.message);
  }
}

// Run the script
generateFixtures().catch((error) => {
  console.error('❌ Error generating fixtures:', error);
  process.exit(1);
});
