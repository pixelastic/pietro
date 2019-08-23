import module from '../dependencyChecker';
import firost from 'firost';
import { _ } from 'golgoth';

describe('dependencyChecker', () => {
  const tmpDirectory = './tmp/dependencyChecker';
  beforeEach(async () => {
    await firost.emptyDir(tmpDirectory);
    _.set(process, 'ENV.TIKA_JAR', '');
    jest.spyOn(module, '__exit').mockReturnValue();
  });

  describe('assertAll', () => {
    it('should not throw if has all dependencies', async () => {
      jest.spyOn(module, 'has').mockReturnValue(true);
      jest.spyOn(module, 'hasTika').mockReturnValue(true);

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
      jest.spyOn(module, 'hasTika').mockReturnValue(true);

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
  describe('tikaJar', () => {
    it('should return false if the TIKA_JAR file does not exist', async () => {
      _.set(process, 'ENV.TIKA_JAR', `${tmpDirectory}/nope.jar`);

      const actual = await module.tikaJar();

      expect(actual).toEqual(false);
    });
    it('should return the TIKA_JAR value if the file exists', async () => {
      const value = `${tmpDirectory}/tika.jar`;
      _.set(process, 'ENV.TIKA_JAR', value);
      await firost.write('foo', value);

      const actual = await module.tikaJar();

      expect(actual).toEqual(value);
    });
    it('should return a default value if no ENV value is set', async () => {
      const value = `${tmpDirectory}/tika.jar`;
      jest.spyOn(module, 'defaultTikaJarFile').mockReturnValue(value);
      _.set(process, 'ENV.TIKA_JAR', undefined);
      await firost.write('foo', value);

      const actual = await module.tikaJar();

      expect(actual).toEqual(value);
    });
    it('should return a default value if the TIKA_JAR value is empty', async () => {
      const value = `${tmpDirectory}/tika.jar`;
      jest.spyOn(module, 'defaultTikaJarFile').mockReturnValue(value);
      _.set(process, 'ENV.TIKA_JAR', '');
      await firost.write('foo', value);

      const actual = await module.tikaJar();

      expect(actual).toEqual(value);
    });
  });
  describe('hasTika', () => {
    it('should throw if no TIKA_JAR env variable', async () => {
      jest.spyOn(module, 'tikaJar').mockReturnValue(false);

      let actual = true;
      try {
        await module.hasTika();
      } catch (err) {
        actual = false;
      }

      expect(actual).toEqual(false);
    });
    it('should return true if a TIKA_JAR variable', async () => {
      jest.spyOn(module, 'tikaJar').mockReturnValue('/some/path');

      const actual = await module.hasTika();

      expect(actual).toEqual(true);
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
