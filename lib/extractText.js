import path from 'path';
import { exists, error as firostError } from 'firost';
import { dockerRun } from './helper.js';

/**
 * Extract text of a pdf into a .txt file
 * @param {string} inputFile Path to the input PDF
 * @param {string} outputFile Path to the output TXT
 **/
export async function extractText(inputFile, outputFile) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_GET_TEXT_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }
  const inputFileBasename = path.basename(inputFile);
  const outputFileBasename = path.basename(outputFile);

  const inputDirectory = path.dirname(inputFile);
  const outputDirectory = path.dirname(inputFile);
  const command = [
    'pdftotext',
    `/app/input/${inputFileBasename}`,
    `/app/output/${outputFileBasename}`,
  ].join(' ');

  await dockerRun(command, { inputDirectory, outputDirectory });
}
