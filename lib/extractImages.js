import path from 'path';
import { exists, error as firostError, glob, mkdirp, move } from 'firost';
import { _, pMap } from 'golgoth';
import { dockerRun } from './helper.js';

/**
 * Extract all images of a given pdf into a given directory
 * @param {string} inputFile Path to the PDF to extract images
 * @param {string} outputDirectory Directory where to extract the images
 **/
export async function extractImages(inputFile, outputDirectory) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_EXTRACT_IMAGES_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  const inputDirectory = path.dirname(inputFile);
  const inputFileBasename = path.basename(inputFile);

  await mkdirp(outputDirectory);

  const prefix = 'PREFIX_TO_REMOVE';
  const command = [
    'pdfimages',
    '-png',
    `/app/input/${inputFileBasename}`,
    `/app/output/${prefix}`,
  ].join(' ');

  await dockerRun(command, { inputDirectory, outputDirectory });

  // pdfimages HAS TO create files with a prefix. We remove it
  const createdFiles = await glob(`${prefix}*png`, {
    context: outputDirectory,
  });
  await pMap(createdFiles, async (filepath) => {
    const newPath = _.replace(
      filepath,
      `${outputDirectory}/${prefix}-`,
      `${outputDirectory}/`,
    );
    await move(filepath, newPath);
  });
}
