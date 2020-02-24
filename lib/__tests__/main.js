const module = require('../main');
const dependencyChecker = require('../dependencyChecker');
const path = require('path');

describe('pietro', () => {
  describe('init', () => {
    it('should make sure all dependencies are here', async () => {
      jest.spyOn(dependencyChecker, 'assertAll').mockReturnValue();

      await module.init('test.pdf');

      expect(dependencyChecker.assertAll).toHaveBeenCalled();
    });
    it('should return a new instance', async () => {
      const actual = await module.init('test.pdf');

      expect(actual).toHaveProperty('inputPath', path.resolve('test.pdf'));
    });
  });
});
