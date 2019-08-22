/* eslint-disable no-process-exit */
import _ from 'lodash';
import os from 'os';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import firost from 'firost';
import ProgressBar from 'progress';
import pMap from 'p-map';
import which from 'which';
const cpuCount = os.cpus().length;

const instance = {
  cache: {},

  /**
   * Save the specified page to its own file
   * @param {Number} pageIndex Index of the page to extract, starting from 1
   * @param {String} destination Path to write the file
   * @returns {Promise} Resolves when file is written
   **/
  async extractPage(pageIndex, destination) {
    if (fs.existsSync(destination)) {
      return false;
    }
    const command = [
      'pdftk',
      `"${this.path}"`,
      `cat ${pageIndex}`,
      `output "${destination}"`,
    ].join(' ');
    const result = await firost.shell(command);
    return result;
  },

  /**
   * Returns the number of pages in the PDF
   * @returns {Number} Number of pages
   **/
  async pageCount() {
    if (this.cache.pageCount) {
      return this.cache.pageCount;
    }
    const command = [
      `pdfinfo "${this.path}"`,
      "grep '^Pages:'",
      "awk '{print $2}'",
    ].join(' | ');
    const pageCount = await firost.shell(command);
    return _.parseInt(_.trim(pageCount));
  },

  /**
   * Save each page to a specific PDF
   * @param {String} destinationDirectory Path where to save the files
   * @returns {Promise} Promise fulfilled when all pages are saved to disk
   **/
  async toIndividualPages(destinationDirectory) {
    // Create directory if needed
    await firost.mkdirp(destinationDirectory);

    // Loop through all pages
    const pageCount = await this.pageCount();
    const progress = new ProgressBar(
      `Extracting individual pages: [:bar] :percent :current/:total`,
      { total: pageCount }
    );
    const range = _.range(1, pageCount + 1);

    await pMap(
      range,
      async pageIndex => {
        const paddedIndex = _.padStart(pageIndex, 4, 0);
        const destinationPath = `${destinationDirectory}/${paddedIndex}.pdf`;
        const result = await this.extractPage(pageIndex, destinationPath);
        progress.tick();
        return result;
      },
      { concurrency: cpuCount }
    );
  },

  /**
   * Convert the PDF to an image
   * @param {String} destination Path to save the png file
   * @returns {Promise} Resolves when saved, rejected if error
   **/
  async toImage(destination) {
    if (fs.existsSync(destination)) {
      return false;
    }

    const command = [
      'convert',
      '-flatten',
      '-density 300',
      '-quality 100',
      `"${this.path}"`,
      `"${path.resolve(destination)}"`,
    ].join(' ');

    try {
      return await firost.shell(command);
    } catch (err) {
      // Default ImageMagick installation have a policy to prevent converting
      // PDF. We'll try to catch that and explain how to fix it
      if (_.includes(err, 'not authorized')) {
        console.warn(
          chalk.yellow(`
  It seems that your ImageMagick is configured to disallow PDF conversion.
  Check this StackOverflow question to see how to fix this
  https://stackoverflow.com/questions/42928765/convertnot-authorized-aaaa-error-constitute-c-readimage-453
        `)
        );
        process.exit(1);
      }
      console.info(err);
      return false;
    }
  },

  async toText(destination) {
    if (fs.existsSync(destination)) {
      return false;
    }

    const jarFile = process.env.TIKA_JAR;

    const command = [
      'java',
      `-jar "${jarFile}"`,
      '--text',
      `"${this.path}"`,
      `> "${destination}"`,
    ].join(' ');

    return await firost.shell(command);
  },
};

const module = {
  init(inputPath) {
    return {
      path: path.resolve(inputPath),
      ...instance,
    };
  },
  /**
   * Check that all the required binaries are installed.
   * Will display the list of missing dependencies in case of failure
   * @returns {Boolean} True if all is installed, false otherwise
   **/
  checkDependencies() {
    const dependencies = {
      convert: 'ImageMagick',
      grep: 'basic shell utility',
      java: 'Java',
      pdfinfo: 'part of Xpdf',
      pdftk: 'PDFToolkit',
      sed: 'basic shell utility',
    };
    const missingDependencies = _.compact(
      _.map(
        dependencies,
        (name, command) =>
          which.sync(command, { nothrow: true }) ? false : { name, command }
      )
    );

    if (!_.isEmpty(missingDependencies)) {
      const errorMessage = ['Missing dependencies:'];
      _.each(missingDependencies, dependency => {
        errorMessage.push(`- ${dependency.command} (${dependency.name})`);
      });
      console.error(chalk.red(errorMessage.join('\n')));
      return false;
    }

    if (!process.env.TIKA_JAR) {
      const errorMessage = `
 Apache Tika is required to extract textual content.
 You need to set the TIKA_JAR env variable to the path to your Apache Tika jar.
 Download it from here:
  https://www.apache.org/dyn/closer.cgi/tika/tika-app-1.19.1.jar
`;
      console.error(chalk.red(errorMessage));
      return false;
    }

    return true;
  },
};

export default _.bindAll(module, _.functions(module));
