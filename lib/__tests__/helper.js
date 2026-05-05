import {
  __,
  dockerRun,
  ensureImageIsAvailable,
  imageExists,
} from '../helper.js';

describe('helper', () => {
  describe('imageExists', () => {
    it('should return true when image exists', async () => {
      // Image is built in globalSetup before all tests
      const actual = await imageExists();

      expect(actual).toBe(true);
    });

    it('should return false when image does not exist', async () => {
      vi.spyOn(__, 'getImageName').mockReturnValue('nonexistent-image-xyz');

      const actual = await imageExists();

      expect(actual).toBe(false);
    });
  });

  describe('ensureImageIsAvailable', () => {
    it('should not build if image already exists', async () => {
      vi.spyOn(__, 'imageExists').mockReturnValue(true);
      vi.spyOn(__, 'buildImage').mockReturnValue();

      await ensureImageIsAvailable();

      expect(__.buildImage).not.toHaveBeenCalled();
    });

    it('should build image if it does not exist', async () => {
      vi.spyOn(__, 'imageExists').mockReturnValue(false);
      vi.spyOn(__, 'buildImage').mockReturnValue();
      vi.spyOn(__, 'consoleInfo').mockReturnValue();
      vi.spyOn(__, 'consoleSuccess').mockReturnValue();

      await ensureImageIsAvailable();

      expect(__.buildImage).toHaveBeenCalled();
    });
  });

  describe('dockerRun', () => {
    it('should ensure image is available', async () => {
      vi.spyOn(__, 'ensureImageIsAvailable').mockResolvedValue();
      vi.spyOn(__, 'run').mockResolvedValue();

      await dockerRun('echo "hello world"');

      expect(__.ensureImageIsAvailable).toHaveBeenCalled();
      expect(__.run).toHaveBeenCalled();
    });
    it.each([
      {
        command: 'echo "test"',
        args: {},
        expected:
          'docker run --rm --name pietro_test-uuid-123 pietro echo "test"',
      },
      {
        command: 'ls /app/input',
        args: { inputDirectory: '/tmp/input' },
        expected:
          'docker run --rm --volume /tmp/input:/app/input --name pietro_test-uuid-123 pietro ls /app/input',
      },
      {
        command: 'ls /app/output',
        args: { outputDirectory: '/tmp/output' },
        expected:
          'docker run --rm --volume /tmp/output:/app/output --name pietro_test-uuid-123 pietro ls /app/output',
      },
      {
        command: 'cp file',
        args: { inputDirectory: '/tmp/in', outputDirectory: '/tmp/out' },
        expected:
          'docker run --rm --volume /tmp/in:/app/input --volume /tmp/out:/app/output --name pietro_test-uuid-123 pietro cp file',
      },
      {
        command: 'env',
        args: { env: { FOO: 'bar', BAZ: 'qux' } },
        expected:
          'docker run --rm --env FOO=bar --env BAZ=qux --name pietro_test-uuid-123 pietro env',
      },
    ])(
      'should call run with: $expected',
      async ({ command, args, expected }) => {
        vi.spyOn(__, 'ensureImageIsAvailable').mockResolvedValue();
        vi.spyOn(__, 'uuid').mockReturnValue('test-uuid-123');
        vi.spyOn(__, 'run').mockResolvedValue({ stdout: '', stderr: '' });

        await dockerRun(command, args);

        expect(__.run).toHaveBeenCalledWith(expected, {
          shell: true,
          stderr: false,
          stdout: false,
        });
      },
    );

    it('should execute a real command in Docker container', async () => {
      const actual = await dockerRun('echo "hello world"');

      expect(actual.stdout).toEqual('hello world');
    });
  });
});
