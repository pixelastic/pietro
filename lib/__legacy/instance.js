import path from 'path';
import { _, pMap } from 'golgoth';
import { absolute, exists, glob, mkdirp, move, run } from 'firost';

/**
 * Object representing a PDF, to convert it to image, split it or extract text
 * @param {string} inputPath Path to the PDF
 * @returns {object} Object containing all methods
 **/
export default function (inputPath) {
  const inputFullPath = path.resolve(inputPath);

  return {
    inputPath: inputFullPath,
    async assert() {
      if (!(await exists(this.inputPath))) {
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
      const { stdout: pageCount } = await this.run(command, {
        shell: true,
        stdout: false,
      });
      return _.parseInt(_.trim(pageCount));
    },
    /**
     * Returns the text content of the file
     * @returns {string} Textual content of the file
     **/
    async getText() {
      await this.assert();

      const command = ['pdftotext', `"${this.inputPath}"`, '-'].join(' ');

      const result = await this.run(command, { shell: true, stdout: false });
      return _.trim(result.stdout);
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
      if (await exists(destination)) {
        return false;
      }
      // Stop if page to extract is invalid
      const maxPage = await this.pageCount();
      if (pageIndex > maxPage) {
        return false;
      }

      const filepath = path.resolve(destination);
      const dirname = path.dirname(filepath);
      await mkdirp(dirname);

      const command = [
        'pdftk',
        `"${this.inputPath}"`,
        `cat ${pageIndex}`,
        `output "${filepath}"`,
      ].join(' ');
      await this.run(command, { shell: true });
      return true;
    },
    /**
     * Convert the PDF to an image
     * @param {string} destination Path to save the png file
     * @returns {boolean} True when converted, false if error
     **/
    async toImage(destination) {
      await this.assert();
      if (await exists(destination)) {
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
        await this.run(command, { shell: true, stderr: false });
        return true;
      } catch (err) {
        // Default ImageMagick installation have a policy to prevent converting
        // PDF. We'll try to catch that and explain how to fix it
        this.__exit(err);
      }
    },
    /**
     * Extract all images from the pdf
     * @param {string} userOutputPath Path to save the extracted images
     */
    async extractImages(userOutputPath) {
      const outputPath = absolute(userOutputPath);
      await this.assert();

      // Extract all images
      await mkdirp(outputPath);
      const command = [
        'pdfimages',
        '-png',
        this.inputPath,
        `${outputPath}/prefix`,
      ].join(' ');
      await this.run(command, { shell: true });

      // Rename images
      const allFiles = await glob(`${outputPath}/prefix-*.png`);
      await pMap(allFiles, async (filepath) => {
        const newPath = _.replace(
          filepath,
          `${outputPath}/prefix-`,
          `${outputPath}/`,
        );
        await move(filepath, newPath);
      });
    },
    async imageList() {
      await this.assert();

      // Get raw list
      const command = ['pdfimages', '-list', this.inputPath].join(' ');
      const { stdout: rawList } = await this.run(command, { shell: true });
      const rawLines = rawList.split('\n');

      const headers = _.chain(rawLines[0]).split(' ').compact().value();
      const lines = _.slice(rawLines, 2);
      return _.transform(lines, (result, line) => {
        const values = _.chain(line).split(' ').compact().value();
        const image = _.zipObject(headers, values);
        result.push({
          pageIndex: _.parseInt(image.page),
          imageIndex: _.parseInt(image.num),
          type: image.type,
          width: _.parseInt(image.width),
          height: _.parseInt(image.height),
          color: image.color,
          objectID: _.parseInt(image.object),
          size: image.size,
        });
      });
    },
    /**
     * Exit the process and display a message
     * @param {string} message Message to display before exiting
     **/
    __exit(message) {
      console.info(message);
      this.process.exit(1);
    },
    process,
    run,
  };
}
