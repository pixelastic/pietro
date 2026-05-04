import path from 'node:path';
import { _ } from 'golgoth';
import { absolute, remove } from 'firost';
import { dockerRun } from '../../helper.js';

/**
 * Create an empty PDF with specified number of blank pages
 * @param {string} filepath - Full path to the PDF file to create
 * @param {number} pageCount - Number of pages to create
 */
export async function createEmptyPdf(filepath, pageCount) {
  const outputDir = path.dirname(filepath);
  const filename = path.basename(filepath);
  const tempFilename = `${filename}.tmp`;

  const clones = _.times(pageCount - 1, () => '\\( +clone \\)').join(' ');

  // Step 1: Create temp PDF with explicit pdf: format prefix
  // ImageMagick uses file extension to determine format, so we need pdf: prefix for .tmp files
  const createCommand = `magick -size 10x10 xc:white ${clones} pdf:/app/output/${tempFilename}`;
  await dockerRun(createCommand, { outputDirectory: outputDir });

  // Step 2: Normalize metadata for deterministic builds
  // exiftool normalizes Title, CreateDate, ModifyDate to fixed values
  const normalizeMetadataCommand = `exiftool -Title='test' -CreateDate='2000:01:01 00:00:00' -ModifyDate='2000:01:01 00:00:00' -overwrite_original /app/input/${tempFilename}`;
  await dockerRun(normalizeMetadataCommand, {
    inputDirectory: outputDir,
    stderr: false,
    stdout: false,
  });

  // Step 3: Normalize PDF structure and ID for deterministic output
  const normalizePdfCommand = `qpdf --deterministic-id /app/input/${tempFilename} /app/output/${filename}`;
  await dockerRun(normalizePdfCommand, {
    inputDirectory: outputDir,
    outputDirectory: outputDir,
  });

  // Step 4: Cleanup temp file
  await remove(absolute(outputDir, tempFilename));
}
