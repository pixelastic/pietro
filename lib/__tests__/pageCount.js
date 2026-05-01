import path from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import { pageCount } from '../pageCount.js';
import { ensureDockerReady } from './testHelpers.js';

describe('pageCount', () => {
  // Ensure Docker image is built before running tests
  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000); // 60s timeout for Docker build if needed

  describe('integration tests with real PDFs', () => {
    it('should count 1 page for test-simple.pdf', async () => {
      const fixturePath = path.resolve('fixtures/test-simple.pdf');
      const count = await pageCount(fixturePath);
      expect(count).toBe(1);
    });

    it('should count 3 pages for test-multi-3pages.pdf', async () => {
      const fixturePath = path.resolve('fixtures/test-multi-3pages.pdf');
      const count = await pageCount(fixturePath);
      expect(count).toBe(3);
    });

    it('should count 5 pages for test-multi-5pages.pdf', async () => {
      const fixturePath = path.resolve('fixtures/test-multi-5pages.pdf');
      const count = await pageCount(fixturePath);
      expect(count).toBe(5);
    });

    it('should work with existing fixtures (foo.pdf)', async () => {
      const fixturePath = path.resolve('fixtures/foo.pdf');
      const count = await pageCount(fixturePath);
      expect(count).toBeGreaterThan(0);
      expect(Number.isInteger(count)).toBe(true);
    });

    it('should work with existing fixtures (bar.pdf)', async () => {
      const fixturePath = path.resolve('fixtures/bar.pdf');
      const count = await pageCount(fixturePath);
      expect(count).toBeGreaterThan(0);
      expect(Number.isInteger(count)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error if input file does not exist', async () => {
      const nonExistentPath = path.resolve('fixtures/non-existent.pdf');

      await expect(pageCount(nonExistentPath)).rejects.toThrow();
      await expect(pageCount(nonExistentPath)).rejects.toMatchObject({
        code: 'PIETRO_PAGE_COUNT_INPUT_FILE_MISSING',
      });
    });

    it('should throw error with correct message for missing file', async () => {
      const nonExistentPath = path.resolve('fixtures/missing.pdf');

      await expect(pageCount(nonExistentPath)).rejects.toThrow(/does not exist/);
    });
  });

  describe('return value validation', () => {
    it('should return an integer number', async () => {
      const fixturePath = path.resolve('fixtures/test-simple.pdf');
      const count = await pageCount(fixturePath);

      expect(typeof count).toBe('number');
      expect(Number.isInteger(count)).toBe(true);
      expect(count).toBeGreaterThan(0);
    });

    it('should never return 0 or negative numbers for valid PDFs', async () => {
      const fixturePath = path.resolve('fixtures/test-multi-3pages.pdf');
      const count = await pageCount(fixturePath);

      expect(count).toBeGreaterThan(0);
    });
  });
});
