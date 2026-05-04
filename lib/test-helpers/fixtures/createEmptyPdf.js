import path from 'node:path';
import { _ } from 'golgoth';
import { absolute, consoleInfo, gitRoot } from 'firost';
import { dockerRun } from '../../helper.js';
import { normalizePdf } from './normalizePdf.js';

/**
 * Create an empty PDF with specified number of blank pages
 * @param {string} filename - Name of the PDF file to create (e.g., 'test-simple.pdf')
 * @param {number} pageCount - Number of pages to create
 */
export async function createEmptyPdf(filename, pageCount) {
  consoleInfo(`Creating ${filename}...`);

  const fixturesDir = absolute(gitRoot(), 'fixtures');
  const filepath = absolute(fixturesDir, filename);

  const clones = _.times(pageCount - 1, () => '\\( +clone \\)').join(' ');
  const createCommand = `magick -size 10x10 xc:white ${clones} /app/output/${filename}`;
  await dockerRun(createCommand, { outputDirectory: fixturesDir });

  await normalizePdf(filepath, fixturesDir);
}
