import path from 'node:path';
import { _ } from 'golgoth';
import { dirname } from 'firost';
import { dockerRun } from '../../helper.js';
import { normalizePdf } from './normalizePdf.js';

/**
 * Create an empty PDF with specified number of blank pages
 * @param {string} filepath - Full path to the PDF file to create
 * @param {number} pageCount - Number of pages to create
 */
export async function createEmptyPdf(filepath, pageCount) {
  const outputDir = dirname(filepath);
  const filename = path.basename(filepath);

  const clones = _.times(pageCount - 1, () => '\\( +clone \\)').join(' ');
  const createCommand = `magick -size 10x10 xc:white ${clones} /app/output/${filename}`;
  await dockerRun(createCommand, { outputDirectory: outputDir });

  await normalizePdf(filepath, outputDir);
}
