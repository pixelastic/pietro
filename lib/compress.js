import path from 'path';
import { exists, error as firostError, mkdirp, move } from 'firost';
import { _ } from 'golgoth';
import { dockerRun } from './helper.js';

/**
 * Compress a PDF, to make it weight less on disk
 * @param {string} inputFile Path to the file to compress
 * @param {string} userOutputFile Path to the new, compressed, file. Optional
 **/
export async function compress(inputFile, userOutputFile) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_COMPRESS_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  // Input
  const inputDirectory = path.dirname(inputFile);
  const inputBasename = path.basename(inputFile);

  // Output
  const compressInPlace = !userOutputFile;
  const outputFile = compressInPlace
    ? _.replace(inputFile, /\.pdf$/, '.tmp.pdf')
    : userOutputFile;
  const outputDirectory = path.dirname(outputFile);
  const outputBasename = path.basename(outputFile);
  await mkdirp(outputDirectory);

  const command = [
    'ocrmypdf',
    '--output-type pdf',
    '--optimize 3',
    '--skip-text',
    `/app/input/${inputBasename}`,
    `/app/output/${outputBasename}`,
  ].join(' ');

  await dockerRun(command, { inputDirectory, outputDirectory });

  if (compressInPlace) {
    await move(outputFile, inputFile);
  }
}
