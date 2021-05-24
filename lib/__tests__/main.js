const current = require('../main');
const dependencyChecker = require('../dependencyChecker');
const path = require('path');

describe('pietro', () => {
  describe('init', () => {
    beforeEach(async () => {
      jest.spyOn(dependencyChecker, 'assertAll').mockReturnValue();
    });
    it('should make sure all dependencies are here', async () => {
      await current.init('test.pdf');

      expect(dependencyChecker.assertAll).toHaveBeenCalled();
    });
    it('should return a new instance', async () => {
      const actual = await current.init('test.pdf');

      expect(actual).toHaveProperty('inputPath', path.resolve('test.pdf'));
    });
  });
});
