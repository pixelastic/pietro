import module from '../index';
import helper from '../test-helper';
const fixture = helper.fixture;

describe('pietro', () => {
  describe('pageCount', () => {
    it('should get the correct page number', async () => {
      const input = module.init(fixture('sample-2-pages.pdf'));

      const actual = await input.pageCount();

      expect(actual).toEqual(2);
    });
  });
});
