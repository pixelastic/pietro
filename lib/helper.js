import os from 'node:os';
import { consoleInfo, consoleSuccess, gitRoot, run, uuid } from 'firost';

const IMAGE_NAME = 'pietro';
/**
 * Run a specific command from inside the docker container
 * @param {string} guestCommand Command to run inside the container
 * @param {object} options Options to pass to the container
 * @param {string} options.inputDirectory Host path mounted on /app/input
 * @param {string} options.outputDirectory Host path mounted on /app/output
 * @returns {object} Return object of the run function
 */
export async function dockerRun(guestCommand, options = {}) {
  await ensureImageIsAvailable();
  const dockerCommand = ['docker run --rm'];

  const { inputDirectory, outputDirectory } = options;
  if (inputDirectory) {
    dockerCommand.push(`--volume ${inputDirectory}:/app/input`);
  }
  if (outputDirectory) {
    dockerCommand.push(`--volume ${outputDirectory}:/app/output`);
  }

  dockerCommand.push(`--name ${IMAGE_NAME}_${uuid()}`);
  dockerCommand.push(IMAGE_NAME);
  dockerCommand.push(guestCommand);
  // console.info({ options, dockerCommand: dockerCommand.join(' ') });

  return await run(dockerCommand.join(' '), { stderr: false, stdout: false });
}

/**
 * Check if the docker image has been built already
 * @returns {boolean} True if the image is available, false otherwise
 */
export async function imageExists() {
  try {
    await run(`docker image inspect --format '{{.Id}}' ${IMAGE_NAME}`, {
      stdout: false,
      stderr: false,
    });
    return true;
  } catch (_err) {
    return false;
  }
}

/**
 * Build the image
 */
export async function buildImage() {
  const { username, uid } = os.userInfo();
  const command = [
    'docker build',
    '.',
    `--build-arg USER_NAME=${username}`,
    `--build-arg USER_ID=${uid}`,
    `--tag ${IMAGE_NAME}`,
  ].join(' ');
  await run(command, {
    stdout: false,
    stderr: false,
    cwd: gitRoot(),
  });
}

/**
 * Make sure the image is built, and if not, build it
 */
export async function ensureImageIsAvailable() {
  if (!(await imageExists())) {
    consoleInfo('Unavailable image. Building image...');
    await buildImage();
    consoleSuccess('Image built');
  }
}
