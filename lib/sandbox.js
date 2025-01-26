import { absolute, gitRoot } from 'firost';
import { extractAllPages } from './main.js';

const inputFile = absolute(gitRoot(), './tmp/fleeMortals.pdf');
const outputDirectory = absolute(gitRoot(), './tmp/fleeMortals/pages');

await extractAllPages(inputFile, outputDirectory);
