const path = require('path');
const which = require('firost/which');
const read = require('firost/read');
const exist = require('firost/exist');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
marked.setOptions({
  renderer: new TerminalRenderer(),
});
module.exports = {
  /**
   * Check if all the executable files needed by the module are available
   * @returns {boolean} True if ok. Process will stop if fails
   **/
  async assertAll() {
    try {
      await this.has('convert');
      await this.has('grep');
      await this.has('sed');
      await this.has('java');
      await this.has('pdfinfo');
      await this.has('pdftk');
      await this.has('pdfimages');
    } catch (err) {
      this.__exit(err.message);
      return false;
    }

    return true;
  },
  /**
   * Check if has one executable. Will throw if not found
   * @param {string} command Command to test
   * @returns {boolean} True if found, throw an error if not found
   * */
  async has(command) {
    if (!(await which(command))) {
      throw await this.error(command);
    }
    return true;
  },
  /**
   * Returns an error with installation instructions as message
   * @param {string} command Command to explain
   * @returns {object} Error object with .message key as full instructions
   **/
  async error(command) {
    const instructionPath = this.instructionPath(command);
    const hasInstructions = await exist(instructionPath);

    let errorMessage;
    if (hasInstructions) {
      const raw = await read(instructionPath);
      errorMessage = this.__marked(raw);
    } else {
      errorMessage = `Can't find ${command}`;
    }

    const newError = new Error(errorMessage);
    newError.message = errorMessage;
    return newError;
  },
  /**
   * Path to the instruction .md file
   * @param {string} command Command to get instructions for
   * @returns {string} Path to the instruction file
   **/
  instructionPath(command) {
    return path.resolve(__dirname, `../instructions/${command}.md`);
  },
  /**
   * Wrapper to convert markdown to terminal output
   * @param {string} text Markdown text
   * @returns {string} Terminal text
   **/
  __marked(text) {
    return marked(text);
  },
  /**
   * Wrapper to display error message and exit
   * @param {string} message Message to display before quitting
   **/
  __exit(message) {
    console.info(message);
    this.process.exit(1);
  },
  process,
};
