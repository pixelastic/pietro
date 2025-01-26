import path from 'path';
import { exists, error as firostError, mkdirp } from 'firost';
import { _ } from 'golgoth';
import { dockerRun } from './helper.js';

/**
 * Save each page to a specific PDF
 * @param {string} inputFile Path to the PDF to extract pages from
 * @param {string} outputDirectory Directory where to extract the pages
 * TODO: Tests:
 * - Should extract n pages from a n-page pdf
 * - Should extract even if the PDF is malformed
 * - Should fail if the input file does not exist
 **/
export async function extractAllPages(inputFile, outputDirectory) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_EXTRACT_ALL_PAGES_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  await mkdirp(outputDirectory);

  const inputDirectory = path.dirname(inputFile);
  const inputFileBasename = path.basename(inputFile);
  const command = [
    'qpdf',
    '--split-pages',
    `/app/input/${inputFileBasename}`,
    `/app/output/${inputFileBasename}`,
  ].join(' ');
  try {
    await dockerRun(command, { inputDirectory, outputDirectory });
  } catch (err) {
    const { stderr, code } = err;
    // The command will technically fail (exit code not equal to 0), if the PDF
    // is malformed and has issues. Some errors we know we can safely ignore
    const recoverableErrors = [
      3, // Success, but warnings along the way
    ];

    // Throw if a real error
    if (!_.includes(recoverableErrors, code)) {
      throw firostError('PIETRO_EXTRACT_ALL_PAGES_QPDF_ERROR', stderr);
    }
  }
}
