import { absolute, copy, exists, mkdirp } from 'firost';
import { FIXTURES_DIR } from './fixturesDir.js';

/**
 * Copy a fixture file to a destination directory
 * @param {string} fixtureName Name of the fixture file (e.g., 'foo.pdf')
 * @param {string} destDir Destination directory path
 * @returns {Promise<string>} Path to the copied file
 */
export async function copyFixture(fixtureName, destDir) {
  const sourcePath = absolute(FIXTURES_DIR, fixtureName);

  if (!(await exists(sourcePath))) {
    throw new Error(`Fixture ${fixtureName} does not exist at ${sourcePath}`);
  }

  await mkdirp(destDir);
  const destPath = absolute(destDir, fixtureName);
  await copy(sourcePath, destPath);

  return destPath;
}
