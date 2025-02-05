import path from 'path';
import { exists, error as firostError, mkdirp } from 'firost';
import { _, pMap } from 'golgoth';
import { dockerRun } from './helper.js';

/**
 * Merge several files together to form a larger PDF
 * @param {Array} inputFiles Array of files to merge together
 * @param {string} outputFile Path to the final path
 **/
export async function mergeFiles(inputFiles, outputFile) {
  const inputDirectory = path.dirname(inputFiles[0]);
  const outputDirectory = path.dirname(outputFile);

  // Ensure arguments are valid
  await pMap(inputFiles, async (inputFile) => {
    // Stop if a file is not in the same repository as the others
    const inputFileDirectory = path.dirname(inputFile);
    if (inputFileDirectory != inputDirectory) {
      throw firostError(
        'PIETRO_MERGE_FILES_FILES_NOT_IN_SAME_FOLDER',
        [
          'All input files should be in the same directory:',
          `- ${inputDirectory}`,
          `- ${inputFileDirectory}`,
        ].join('\n'),
      );
    }

    // Stop if a file does not exist
    if (!(await exists(inputFile))) {
      throw firostError(
        'PIETRO_MERGE_FILES_IMAGES_INPUT_FILE_MISSING',
        `The file ${inputFile} does not exist`,
      );
    }
  });

  await mkdirp(outputDirectory);

  // Replace all input files with version in /app/input
  const guestInputFiles = _.map(inputFiles, (inputFile) => {
    const basename = path.basename(inputFile);
    return `/app/input/${basename}`;
  });
  const outputBasename = path.basename(outputFile);

  const command = [
    'pdfunite',
    guestInputFiles.join(' '),
    `/app/output/${outputBasename}`,
  ].join(' ');

  await dockerRun(command, { inputDirectory, outputDirectory });
}
