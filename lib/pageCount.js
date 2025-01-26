import path from 'path';
import { exists, error as firostError } from 'firost';
import { _ } from 'golgoth';
import { dockerRun } from './helper.js';

/**
 * Return the number of pages of a given PDF
 * @param {string} inputFile Filepath to the PDF
 * @returns {number} Number of pages
 **/
export async function pageCount(inputFile) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_PAGE_COUNT_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  const inputDirectory = path.dirname(inputFile);
  const inputFileBasename = path.basename(inputFile);
  const command = [
    'qpdf',
    '--show-npages',
    `/app/input/${inputFileBasename}`,
  ].join(' ');

  const result = await dockerRun(command, { inputDirectory });

  return _.parseInt(result.stdout);
}
