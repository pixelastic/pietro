import firost from 'firost';
import current from '../dependencyChecker.js';

describe('dependencyChecker', () => {
  const tmpDirectory = './tmp/dependencyChecker';
  beforeEach(async () => {
    await firost.emptyDir(tmpDirectory);
    vi.spyOn(current, '__exit').mockReturnValue();
  });

  describe('assertAll', () => {
    it('should not throw if has all dependencies', async () => {
      vi.spyOn(current, 'has').mockReturnValue(true);

      let actual = true;
      try {
        await current.assertAll();
      } catch (_err) {
        actual = false;
      }

      expect(actual).toEqual(true);
    });
    it('should quit with the message from the dep that failed', async () => {
      vi.spyOn(current, 'has').mockImplementation((command) => {
        if (command === 'sed') {
          throw { message: 'foo' };
        }
        return true;
      });

      await current.assertAll();

      expect(current.__exit).toHaveBeenCalledWith('foo');
    });
  });
  describe('has', () => {
    it('should return true if the command is available', async () => {
      const actual = await current.has('touch');

      expect(actual).toEqual(true);
    });
    it('should throw an error with instruction on how to install if not available', async () => {
      let actual;
      vi.spyOn(current, 'error').mockReturnValue('instructions');

      try {
        await current.has('nopenopenope');
      } catch (err) {
        actual = err;
      }

      expect(actual).toEqual('instructions');
    });
  });
  describe('error', () => {
    it('should return the instructions from a file', async () => {
      await firost.write('## foo', `${tmpDirectory}/touch.md`);
      vi.spyOn(current, 'instructionPath').mockReturnValue(
        `${tmpDirectory}/touch.md`,
      );
      vi.spyOn(current, '__marked').mockReturnValue('converted foo');

      const actual = await current.error('touch');

      expect(actual).toHaveProperty('message', 'converted foo');
      expect(current.__marked).toHaveBeenCalledWith('## foo');
    });
  });
});
