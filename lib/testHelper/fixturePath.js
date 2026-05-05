import { absolute } from 'firost';
import { FIXTURES_DIR } from './fixturesDir.js';

/**
 * Get the absolute path to a fixture file
 * @param {string} filename Name of the fixture file (e.g., 'test-simple.pdf')
 * @returns {string} Absolute path to the fixture file
 */
export function fixturePath(filename) {
  return absolute(FIXTURES_DIR, filename);
}
