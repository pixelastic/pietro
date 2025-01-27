import path from 'path';
import {
  absolute,
  copy,
  exists,
  error as firostError,
  glob,
  mkdirp,
  move,
  readJson,
  writeJson,
} from 'firost';
import { _, pMap } from 'golgoth';
import { dockerRun } from './helper.js';

/**
 * Extract all images of a given pdf into a given directory
 * @param {string} inputFile Path to the PDF to extract images
 * @param {string} extractImageDirectory Image extraction folder
 * Note: For a file 042.pdf, the file structure will be similar to:
 *
 * {outputDirectory}/
 *
 * # Where all raw files will be extracted.
 * # This can safely be deleted once all files have been converted, to save up
 * # disk space
 * {outputDirectory}/raw/
 * {outputDirectory}/raw/042/
 * {outputDirectory}/raw/042/manifest.json
 * {outputDirectory}/raw/042/001.png
 * {outputDirectory}/raw/042/...
 * {outputDirectory}/raw/042/125.png
 *
 * # This is where all final files are saved
 * {outputDirectory}/illustrations/
 * {outputDirectory}/illustrations/042/
 * {outputDirectory}/illustrations/042/1.png
 **/
export async function extractImages(inputFile, extractImageDirectory) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_EXTRACT_IMAGES_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  // Create the manifest as ./manifest.json
  await createManifest(inputFile, extractImageDirectory);

  // Extract raw images in ./raw
  await extractRawImages(inputFile, extractImageDirectory);

  // Extract illustration images into ./illustrations
  await extractIllustrationImages(inputFile, extractImageDirectory);
}

/**
 * Creates a manifest.json file with the list of all images in the input PDF
 * @param {string} inputFile Path to the PDF
 * @param {string} extractImageDirectory Image extraction folder
 */
async function createManifest(inputFile, extractImageDirectory) {
  const inputDirectory = path.dirname(inputFile);
  const inputFileBasename = path.basename(inputFile);
  const inputFileBasenameWithoutExtension = path.basename(inputFile, '.pdf');

  const outputFile = absolute(
    extractImageDirectory,
    'raw',
    inputFileBasenameWithoutExtension,
    'manifest.json',
  );

  // Skip if manifest already saved
  if (await exists(outputFile)) {
    return;
  }

  const command = [
    'pdfimages',
    '-list',
    `/app/input/${inputFileBasename}`,
  ].join(' ');

  const { stdout } = await dockerRun(command, { inputDirectory });

  const lines = stdout.split('\n');
  const headers = _.chain(lines[0]).split(' ').compact().value();
  const manifest = _.chain(lines)
    .slice(2)
    .transform((result, line) => {
      const values = _.chain(line).split(' ').compact().value();
      const image = _.zipObject(headers, values);
      result.push({
        imageIndex: _.parseInt(image.num),
        type: image.type,
        width: _.parseInt(image.width),
        height: _.parseInt(image.height),
        color: image.color,
        objectID: _.parseInt(image.object),
        size: image.size,
      });
    }, [])
    .value();

  await writeJson(manifest, outputFile);
}

/**
 * Extract all images from the input file into the specified directory
 *
 * @param {string} inputFile Path to the PDF to extract images
 * @param {string} extractImageDirectory Image extraction folder
 */
async function extractRawImages(inputFile, extractImageDirectory) {
  const prefix = 'PREFIX_TO_REMOVE';
  const inputDirectory = path.dirname(inputFile);
  const inputFileBasename = path.basename(inputFile);
  const inputFileBasenameWithoutExtension = path.basename(inputFile, '.pdf');
  const outputDirectory = absolute(
    extractImageDirectory,
    'raw',
    inputFileBasenameWithoutExtension,
  );

  // Stop if we already have the same number of raw files as what is in the
  // manifest. We exclude files starting with the pdfimages prefix as it means
  // those files were not properly processed and shouldn't count
  const manifest = await readJson(absolute(outputDirectory, 'manifest.json'));
  const rawFiles = await glob(['*.png', `!${prefix}*.png`], {
    context: outputDirectory,
  });
  if (manifest.length == rawFiles.length) {
    return;
  }

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

/**
 * Extract ilustration image only into a specific directory
 *
 * @param {string} inputFile Path to the PDF to extract images
 * @param {string} extractImageDirectory Image extraction folder
 */
async function extractIllustrationImages(inputFile, extractImageDirectory) {
  const inputFileBasenameWithoutExtension = path.basename(inputFile, '.pdf');
  const rawDirectory = absolute(
    extractImageDirectory,
    'raw',
    inputFileBasenameWithoutExtension,
  );
  const illustrationDirectory = absolute(
    extractImageDirectory,
    'illustrations',
    inputFileBasenameWithoutExtension,
  );

  // We filter to only keep images that look like illustration images (in color,
  // large enough)
  const manifestPath = absolute(rawDirectory, 'manifest.json');
  const rawManifest = await readJson(manifestPath);
  const minHeight = 100;
  const minWidth = 100;
  const images = _.chain(rawManifest)
    .filter({ type: 'image', color: 'icc' })
    .filter(({ width, height }) => {
      return width > minWidth && height > minHeight;
    })
    .value();

  // We save the file in ./illustrations
  const concurrency = 1;
  await pMap(
    images,
    async (image, index) => {
      const { objectID, imageIndex } = image;
      const illustrationPath = absolute(illustrationDirectory, `${index}.png`);

      // Check if we need to apply a mask on the image to get the final png
      const mask = _.find(rawManifest, {
        objectID,
        color: 'gray',
        type: 'smask',
      });
      if (mask) {
        await composeImageWithMask(rawDirectory, image, mask, illustrationPath);
        return;
      }

      // No mask, we directly copy it to the illustration folder
      const rawImagePath = await getImagePathByIndex(imageIndex, rawDirectory);
      await copy(rawImagePath, illustrationPath);
    },
    { concurrency },
  );
}

/**
 * Apply a mask on an image to generate a new image
 * @param {string} rawDirectory Directory where the raw files are extracted
 * @param {object} image Data for the image, from the manifest
 * @param {object} mask Data for the path, from the manifest
 * @param {string} outputPath Path to the output image
 */
async function composeImageWithMask(rawDirectory, image, mask, outputPath) {
  const imagePath = await getImagePathByIndex(image.imageIndex, rawDirectory);
  const maskPath = await getImagePathByIndex(mask.imageIndex, rawDirectory);

  // Ensure image and mask are in the same folder, as we can only mount one
  // /app/input volume
  const imageDirectory = path.dirname(imagePath);
  const maskDirectory = path.dirname(maskPath);
  if (imageDirectory != maskDirectory) {
    throw firostError(
      'PIETRO_EXTRACT_IMAGES_RAW_AND_MASK_NOT_IN_SAME_FOLDER',
      [
        'The image and mask are not located in the same folder:',
        `- image: ${imagePath}`,
        `- mask: ${maskPath}`,
      ].join('\n'),
    );
  }
  const inputDirectory = imageDirectory;

  const outputDirectory = path.dirname(outputPath);
  await mkdirp(outputDirectory);

  // Apply the mask on the image
  const imageBasename = path.basename(imagePath);
  const maskBasename = path.basename(maskPath);
  const outputBasename = path.basename(outputPath);

  const { width, height } = image;
  const composeCommand = [
    'magick composite',
    '-compose CopyOpacity',
    `-resize ${width}x${height}`,
    `/app/input/${maskBasename}`,
    `/app/input/${imageBasename}`,
    `PNG32:/app/output/${outputBasename}`,
  ].join(' ');

  await dockerRun(composeCommand, { inputDirectory, outputDirectory });

  // Trim the output, to remove unwanted whitespace around it
  const trimCommand = [
    'magick',
    `/app/input/${outputBasename}`,
    '-trim',
    `PNG32:/app/input/${outputBasename}`,
  ].join(' ');

  await dockerRun(trimCommand, { inputDirectory: outputDirectory });
}

/**
 * Returns the full page of an image in a directory based on its index name
 * @param {number} imageIndex Index of the image (1, 12, etc)
 * @param {string} rawDirectory Directory to search in
 * @returns {string} Full filepath of the file
 */
async function getImagePathByIndex(imageIndex, rawDirectory) {
  return (await glob(`*${imageIndex}.png`, { context: rawDirectory }))[0];
}
