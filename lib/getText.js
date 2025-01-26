import path from 'path';
import { exists, error as firostError } from 'firost';
import { dockerRun } from './helper.js';

/**
 * Returns the text of a PDF file
 * @param {string} inputFile Path to the input PDF
 * @returns {string} Text content of the file
 **/
export async function getText(inputFile) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_GET_TEXT_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  const inputDirectory = path.dirname(inputFile);
  const inputFileBasename = path.basename(inputFile);
  const command = ['pdftotext', `/app/input/${inputFileBasename}`, '-'].join(
    ' ',
  );

  const result = await dockerRun(command, { inputDirectory });
  return result.stdout;
}
