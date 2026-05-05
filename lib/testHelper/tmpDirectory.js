import { absolute, gitRoot, uuid } from 'firost';

/**
 * Creates and returns an absolute path to a temporary directory within the git repository.
 * @returns {Promise<string>} A promise that resolves to the absolute path of a unique temporary directory
 */
export async function tmpDirectory() {
  return absolute(gitRoot(), 'tmp', uuid());
}
