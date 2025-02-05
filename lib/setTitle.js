import path from 'path';
import { exists, error as firostError } from 'firost';
import { _ } from 'golgoth';
import { dockerRun } from './helper.js';

/**
 * Set the metadata title of the PDF
 * @param {string} inputFile Path to the file
 * @param {string} title New title
 **/
export async function setTitle(inputFile, title) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_SET_TITLE_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  // Input
  const inputDirectory = path.dirname(inputFile);
  const inputBasename = path.basename(inputFile);

  const escapedTitle = _.chain(title).replace(/ /g, '\\ ').value();

  const command = [
    'exiftool',
    `-Title=${escapedTitle}`,
    '-overwrite_original',
    `/app/input/${inputBasename}`,
  ].join(' ');

  await dockerRun(command, { inputDirectory });
}
