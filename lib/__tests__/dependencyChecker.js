const module = require('../dependencyChecker');
const firost = require('firost');

describe('dependencyChecker', () => {
  const tmpDirectory = './tmp/dependencyChecker';
  beforeEach(async () => {
    await firost.emptyDir(tmpDirectory);
    jest.spyOn(module, '__exit').mockReturnValue();
  });

  describe('assertAll', () => {
    it('should not throw if has all dependencies', async () => {
      jest.spyOn(module, 'has').mockReturnValue(true);

      let actual = true;
      try {
        await module.assertAll();
      } catch (err) {
        actual = false;
      }

      expect(actual).toEqual(true);
    });
    it('should quit with the message from the dep that failed', async () => {
      jest.spyOn(module, 'has').mockImplementation(command => {
        if (command === 'sed') {
          throw { message: 'foo' };
        }
        return true;
      });

      await module.assertAll();

      expect(module.__exit).toHaveBeenCalledWith('foo');
    });
  });
  describe('has', () => {
    it('should return true if the command is available', async () => {
      const actual = await module.has('touch');

      expect(actual).toEqual(true);
    });
    it('should throw an error with instruction on how to install if not available', async () => {
      let actual;
      jest.spyOn(module, 'error').mockReturnValue('instructions');

      try {
        await module.has('nopenopenope');
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
        .spyOn(module, 'instructionPath')
        .mockReturnValue(`${tmpDirectory}/touch.md`);
      jest.spyOn(module, '__marked').mockReturnValue('converted foo');

      const actual = await module.error('touch');

      expect(actual).toHaveProperty('message', 'converted foo');
      expect(module.__marked).toHaveBeenCalledWith('## foo');
    });
  });
});
