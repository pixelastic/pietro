import { _, pMap } from 'golgoth';
import firost from 'firost';
import os from 'os';
import path from 'path';
import ProgressBar from 'progress';
import dependencyChecker from './dependencyChecker.js';

/**
 * Object representing a PDF, to convert it to image, split it or extract text
 * @param {string} inputPath Path to the PDF
 * @returns {object} Object containing all methods
 **/
export default function(inputPath) {
  const inputFullPath = path.resolve(inputPath);

  const cpuCount = os.cpus().length;
  return {
    inputPath: inputFullPath,
    async assert() {
      if (!(await firost.exist(this.inputPath))) {
        throw new Error(`${this.inputPath} does not exist`);
      }
    },
    cache: {},
    /**
     * Returns the number of pages in the PDF
     * @returns {number} Number of pages
     **/
    async pageCount() {
      await this.assert();
      if (this.cache.pageCount) {
        return this.cache.pageCount;
      }
      const command = [
        `pdfinfo "${this.inputPath}"`,
        "grep '^Pages:'",
        "awk '{print $2}'",
      ].join(' | ');
      const pageCount = await firost.shell(command);
      return _.parseInt(_.trim(pageCount));
    },
    /**
     * Returns the text content of the file
     * @returns {string} Textual content of the file
     **/
    async getText() {
      await this.assert();

      const command = ['pdftotext', `"${this.inputPath}"`, '-'].join(' ');

      return await firost.shell(command);
    },
    /**
     * Save the specified page to its own file
     * @param {number} pageIndex Index of the page to extract, starting from 1
     * @param {string} destination Path to write the file
     * @returns {boolean} False on failure, true on success
     **/
    async extractPage(pageIndex, destination) {
      await this.assert();
      // Stop if destination already exist
      if (await firost.exist(destination)) {
        return false;
      }
      // Stop if page to extract is invalid
      const maxPage = await this.pageCount();
      if (pageIndex > maxPage) {
        return false;
      }

      const filepath = path.resolve(destination);
      const dirname = path.dirname(filepath);
      await firost.mkdirp(dirname);

      const command = [
        'pdftk',
        `"${this.inputPath}"`,
        `cat ${pageIndex}`,
        `output "${filepath}"`,
      ].join(' ');
      await firost.shell(command);
      return true;
    },
    /**
     * Save each page to a specific PDF
     * @param {string} destinationDirectory Path where to save the files
     * @returns {boolean} True when all files are extracted
     **/
    async extractAllPages(destinationDirectory) {
      await this.assert();
      const pageCount = await this.pageCount();
      const progress = new ProgressBar(
        'Extracting individual pages: [:bar] :percent :current/:total',
        { total: pageCount }
      );
      const range = _.range(1, pageCount + 1);

      await pMap(
        range,
        async pageIndex => {
          const paddedIndex = _.padStart(pageIndex, 4, 0);
          const destinationPath = path.resolve(
            `${destinationDirectory}/${paddedIndex}.pdf`
          );
          const result = await this.extractPage(pageIndex, destinationPath);
          progress.tick();
          return result;
        },
        { concurrency: cpuCount }
      );
      return true;
    },
    /**
     * Convert the PDF to an image
     * @param {string} destination Path to save the png file
     * @returns {boolean} True when converted, false if error
     **/
    async toImage(destination) {
      await this.assert();
      if (await firost.exist(destination)) {
        return false;
      }

      const command = [
        'convert',
        '-flatten',
        '-density 300',
        '-quality 100',
        `"${this.inputPath}"`,
        `"${path.resolve(destination)}"`,
      ].join(' ');

      try {
        await firost.shell(command);
        return true;
      } catch (err) {
        // Default ImageMagick installation have a policy to prevent converting
        // PDF. We'll try to catch that and explain how to fix it
        if (_.includes(err.toString(), 'not authorized')) {
          const error = await dependencyChecker.error('convert-not-authorized');
          return this.__exit(error.message);
        }
        this.__exit(err);
      }
    },
    /**
     * Extract all images from the pdf
     * @param {string} destinationDirectory Path to save the extracted images
     */
    async extractImages(destinationDirectory) {
      await this.assert();

      // Extract all images
      await firost.mkdirp(destinationDirectory);
      const command = [
        'pdfimages',
        '-png',
        this.inputPath,
        `${destinationDirectory}/prefix`,
      ].join(' ');
      await firost.shell(command);

      // Rename images
      const allFiles = await firost.glob(
        `${destinationDirectory}/prefix-*.png`
      );
      await pMap(allFiles, async filepath => {
        const newPath = _.replace(
          filepath,
          `${destinationDirectory}/prefix-`,
          `${destinationDirectory}/`
        );
        await firost.move(filepath, newPath);
      });
    },
    /**
     * Exit the process and display a message
     * @param {string} message Message to display before exiting
     **/
    __exit(message) {
      console.info(message);
      process.exit(1);
    },
  };
}
