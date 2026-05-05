import { ensureImageIsAvailable } from './lib/helper.js';

/**
 * Global setup for Vitest - runs once before all tests
 * Ensures Docker image is built before running any tests
 */
export default async function setup() {
  await ensureImageIsAvailable();
}
