import os from 'node:os';
import { _ } from 'golgoth';
import { consoleInfo, consoleSuccess, gitRoot, run, uuid } from 'firost';

export let __;
/**
 * Run a specific command from inside the docker container
 * @param {string} guestCommand Command to run inside the container
 * @param {object} options Options to pass to the container
 * @param {string} options.inputDirectory Host path mounted on /app/input
 * @param {string} options.outputDirectory Host path mounted on /app/output
 * @param {object} options.env Environment variables to pass to the container
 * @returns {object} Return object of the run function
 */
export async function dockerRun(guestCommand, options = {}) {
  await __.ensureImageIsAvailable();
  const dockerCommand = ['docker run --rm'];
  const { inputDirectory, outputDirectory, env } = options;

  // Mount volumes
  if (inputDirectory) {
    dockerCommand.push(`--volume ${inputDirectory}:/app/input`);
  }
  if (outputDirectory) {
    dockerCommand.push(`--volume ${outputDirectory}:/app/output`);
  }

  // Env variables
  if (env) {
    _.forEach(env, (value, key) => {
      dockerCommand.push(`--env ${key}=${value}`);
    });
  }

  dockerCommand.push(`--name ${__.getImageName()}_${__.uuid()}`);
  dockerCommand.push(__.getImageName());
  dockerCommand.push(guestCommand);

  return await __.run(dockerCommand.join(' '), {
    shell: true,
    stderr: false,
    stdout: false,
  });
}

/**
 * Check if the docker image has been built already
 * @returns {boolean} True if the image is available, false otherwise
 */
export async function imageExists() {
  try {
    await __.run(
      `docker image inspect --format '{{.Id}}' ${__.getImageName()}`,
      {
        stdout: false,
        stderr: false,
      },
    );
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
    `--tag ${__.getImageName()}`,
  ].join(' ');
  await __.run(command, {
    stdout: false,
    stderr: false,
    cwd: gitRoot(),
  });
}

/**
 * Make sure the image is built, and if not, build it
 */
export async function ensureImageIsAvailable() {
  if (!(await __.imageExists())) {
    __.consoleInfo('Unavailable image. Building image...');
    await __.buildImage();
    __.consoleSuccess('Image built');
  }
}

__ = {
  /**
   * Get the Docker image name
   * @returns {string} Docker image name
   */
  getImageName() {
    return 'pietro';
  },
  uuid,
  run,
  consoleInfo,
  consoleSuccess,
  imageExists,
  buildImage,
  ensureImageIsAvailable,
  dockerRun,
};
