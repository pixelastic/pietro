const current = require('../dependencyChecker');
const firost = require('firost');

describe('dependencyChecker', () => {
  const tmpDirectory = './tmp/dependencyChecker';
  beforeEach(async () => {
    await firost.emptyDir(tmpDirectory);
    jest.spyOn(current, '__exit').mockReturnValue();
  });

  describe('assertAll', () => {
    it('should not throw if has all dependencies', async () => {
      jest.spyOn(current, 'has').mockReturnValue(true);

      let actual = true;
      try {
        await current.assertAll();
      } catch (err) {
        actual = false;
      }

      expect(actual).toEqual(true);
    });
    it('should quit with the message from the dep that failed', async () => {
      jest.spyOn(current, 'has').mockImplementation((command) => {
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
      jest.spyOn(current, 'error').mockReturnValue('instructions');

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
      jest
        .spyOn(current, 'instructionPath')
        .mockReturnValue(`${tmpDirectory}/touch.md`);
      jest.spyOn(current, '__marked').mockReturnValue('converted foo');

      const actual = await current.error('touch');

      expect(actual).toHaveProperty('message', 'converted foo');
      expect(current.__marked).toHaveBeenCalledWith('## foo');
    });
  });
});
