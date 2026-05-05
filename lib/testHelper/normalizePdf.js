import path from 'node:path';
import { dockerRun } from '../helper.js';

/**
 * Normalize a PDF to make it deterministic across builds
 *
 * This function normalizes a PDF in-place by:
 * 1. Setting fixed metadata values (Title, CreateDate, ModifyDate) with exiftool
 * 2. Normalizing PDF structure and ID with qpdf --deterministic-id
 *
 * @param {string} filepath - Absolute path to the PDF file to normalize
 * @param {string} workingDirectory - Directory containing the file (for Docker mounting)
 */
export async function normalizePdf(filepath, workingDirectory) {
  const filename = path.basename(filepath);

  // Step 1: Normalize Title, CreateDate, ModifyDate to fixed values in-place
  const exiftoolArgs = [
    'exiftool',
    "-Title='test'",
    "-CreateDate='2000:01:01 00:00:00'",
    "-ModifyDate='2000:01:01 00:00:00'",
    '-overwrite_original',
    `/app/input/${filename}`,
  ];
  const normalizeMetadataCommand = exiftoolArgs.join(' ');
  await dockerRun(normalizeMetadataCommand, {
    inputDirectory: workingDirectory,
    stderr: false,
    stdout: false,
  });

  // Step 2: Sets deterministic id
  const normalizePdfCommand = `qpdf --deterministic-id --replace-input /app/input/${filename}`;
  await dockerRun(normalizePdfCommand, {
    inputDirectory: workingDirectory,
  });
}
