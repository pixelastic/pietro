import { pageCount } from '../pageCount.js';
import { fixturePath } from '../testHelper/main.js';

describe('pageCount', () => {
  it.each([
    { filename: 'test-simple.pdf', expected: 1 },
    { filename: 'test-multi-3pages.pdf', expected: 3 },
    { filename: 'test-multi-5pages.pdf', expected: 5 },
  ])(
    'should count $expected page(s) in $filename',
    async ({ filename, expected }) => {
      const filepath = fixturePath(filename);
      const count = await pageCount(filepath);
      expect(count).toBe(expected);
    },
  );

  it('should throw error with correct code and message if file does not exist', async () => {
    const nonExistentPath = fixturePath('non-existent.pdf');

    let actual = null;
    try {
      await pageCount(nonExistentPath);
    } catch (error) {
      actual = error;
    }

    expect(actual).toHaveProperty(
      'code',
      'PIETRO_PAGE_COUNT_INPUT_FILE_MISSING',
    );
    expect(actual.message).toMatch(/does not exist/);
  });
});
