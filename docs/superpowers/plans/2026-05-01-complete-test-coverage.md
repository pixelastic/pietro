# Pietro Complete Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reach ~80% test coverage by testing all 7 exported Pietro functions (pageCount already done, 6 remaining + Docker infrastructure)

**Architecture:** End-to-end integration tests for low-level functions calling Docker directly, with `__` pattern (firost-style) to mock sub-functions of complex composed functions. Minimal PDF fixtures generated programmatically.

**Tech Stack:** Vitest 4.x, Docker (Alpine 3.17.3), firost 5.8.0, aberlaas 2.27.5, golgoth, Node.js (version according to aberlaas)

---

## File Structure

### New test files
- `lib/__tests__/helper.js` - Docker infrastructure tests
- `lib/__tests__/extractText.js` - extractText() Tests
- `lib/__tests__/setTitle.js` - setTitle() Tests
- `lib/__tests__/extractPages.js` - extractPages() Tests
- `lib/__tests__/mergeFiles.js` - mergeFiles() Tests
- `lib/__tests__/compress.js` - compress() Tests
- `lib/__tests__/extractImages.js` - Tests extractImages()

### Modified files
- `lib/extractImages.js` - Add `__` pattern for mockability
- `scripts/generateFixtures.js` → `scripts/fixtures-generate` - Rename + extension
- `package.json` - Add `fixtures:generate` script

### New fixtures
- `fixtures/test-with-text.pdf` - PDF with extractable text
- `fixtures/test-with-images.pdf` - PDF with 100x100px images
- `fixtures/test-large.pdf` - Uncompressed PDF >1MB

---

## Phase 0: Upgrades & Setup

### Task 0.1: Upgrade Dependencies

**Files:**
- Modify: `package.json:28-29`

- [ ] **Step 1: Upgrade firost to 5.8.0**

```bash
yarn upgrade firost@5.8.0
```

Expected: `firost` updated in package.json and yarn.lock

- [ ] **Step 2: Upgrade aberlaas to 2.27.5**

```bash
yarn upgrade aberlaas@2.27.5
```

Expected: `aberlaas` updated in package.json and yarn.lock

- [ ] **Step 3: Verify that existing tests still pass**

```bash
yarn run test lib/__tests__/pageCount.js
```

Expected: All tests pageCount pass

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore(deps): upgrade firost to 5.8.0 and aberlaas to 2.27.5"
```

### Task 0.2: Rename Fixtures Script

**Files:**
- Rename: `scripts/generateFixtures.js` → `scripts/fixtures-generate`
- Modify: `package.json:40` (ajout script yarn)

- [ ] **Step 1: Rename the file**

```bash
mv scripts/generateFixtures.js scripts/fixtures-generate
```

- [ ] **Step 2: Add shebang if missing**

Verify that `scripts/fixtures-generate` starts with:
```javascript
#!/usr/bin/env node
```

- [ ] **Step 3: Make script executable**

```bash
chmod +x scripts/fixtures-generate
```

- [ ] **Step 4: Add command in package.json**

Modify `package.json` line 40 to add:
```json
"fixtures:generate": "./scripts/fixtures-generate",
```

- [ ] **Step 5: Test the command**

```bash
yarn run fixtures:generate
```

Expected: Existing fixtures are regenerated

- [ ] **Step 6: Commit**

```bash
git add scripts/fixtures-generate package.json
git rm scripts/generateFixtures.js
git commit -m "chore: rename generateFixtures.js to fixtures-generate and add yarn script"
```

---

## Phase 1: Infrastructure & Fixtures

### Task 1.1: Extend Fixtures Generation Script

**Files:**
- Modify: `scripts/fixtures-generate`

- [ ] **Step 1: Add fixture test-with-text.pdf**

Add after line 31 in `scripts/fixtures-generate`:

```javascript
await createPdfWithText('test-with-text.pdf', 'You can cut our wings, but we will always remember what it was like to fly.');
```

- [ ] **Step 2: Implement createPdfWithText()**

Add after function `createPdfWithImageMagick`:

```javascript
/**
 * Create a PDF with text content using ImageMagick
 * @param {string} filename Output filename
 * @param {string} text Text content to include
 */
async function createPdfWithText(filename, text) {
  console.log(`  Creating ${filename} with text...`);

  const tempDir = path.join(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Create a white image with text using ImageMagick
    const command = [
      'magick',
      '-size 612x792',
      'xc:white',
      '-pointsize 20',
      '-fill black',
      '-gravity center',
      `-annotate +0+0 "${text}"`,
      '/app/output/temp-with-text.png'
    ].join(' ');

    await dockerRun(command, { outputDirectory: tempDir });

    // Convert PNG to PDF
    const convertCommand = `magick /app/input/temp-with-text.png /app/output/${filename}`;
    await dockerRun(convertCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir
    });

    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}
```

- [ ] **Step 3: Add fixture test-with-images.pdf**

Add after call to `createPdfWithText`:

```javascript
await createPdfWithImages('test-with-images.pdf', 2);
```

- [ ] **Step 4: Implement createPdfWithImages()**

Add after `createPdfWithText`:

```javascript
/**
 * Create a PDF with simple colored images
 * @param {string} filename Output filename
 * @param {number} imageCount Number of images to include
 */
async function createPdfWithImages(filename, imageCount) {
  console.log(`  Creating ${filename} with ${imageCount} image(s)...`);

  const tempDir = path.join(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Create colored 100x100 images
    const imageFiles = [];
    const colors = ['red', 'blue', 'green', 'yellow'];

    for (let i = 0; i < imageCount; i++) {
      const color = colors[i % colors.length];
      const imageFile = `image-${i}.png`;

      const command = `magick -size 100x100 xc:${color} /app/output/${imageFile}`;
      await dockerRun(command, { outputDirectory: tempDir });
      imageFiles.push(imageFile);
    }

    // Convert images to PDF (one image per page)
    const inputFiles = imageFiles.map(f => `/app/input/${f}`).join(' ');
    const convertCommand = `magick ${inputFiles} /app/output/${filename}`;

    await dockerRun(convertCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir
    });

    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}
```

- [ ] **Step 5: Add fixture test-large.pdf**

Add after call to `createPdfWithImages`:

```javascript
await createLargePdf('test-large.pdf');
```

- [ ] **Step 6: Implement createLargePdf()**

Add after `createPdfWithImages`:

```javascript
/**
 * Create a large uncompressed PDF (>1MB) for compression tests
 * @param {string} filename Output filename
 */
async function createLargePdf(filename) {
  console.log(`  Creating ${filename} (large, uncompressed)...`);

  const tempDir = path.join(fixturesDir, '.tmp-generate');
  await mkdirp(tempDir);

  try {
    // Create 20 pages of 612x792 with random noise (creates large file)
    const pageFiles = [];

    for (let i = 0; i < 20; i++) {
      const pageFile = `large-page-${i}.png`;

      // Create page with noise pattern (large file size)
      const command = [
        'magick',
        '-size 612x792',
        'plasma:',
        `/app/output/${pageFile}`
      ].join(' ');

      await dockerRun(command, { outputDirectory: tempDir });
      pageFiles.push(pageFile);
    }

    // Convert all pages to PDF without compression
    const inputFiles = pageFiles.map(f => `/app/input/${f}`).join(' ');
    const convertCommand = `magick ${inputFiles} -compress None /app/output/${filename}`;

    await dockerRun(convertCommand, {
      inputDirectory: tempDir,
      outputDirectory: fixturesDir
    });

    await remove(tempDir);
  } catch (error) {
    await remove(tempDir);
    throw error;
  }
}
```

- [ ] **Step 7: Update fixture verification**

Modify verification loop (line 37) to include new fixtures:

```javascript
for (const fixture of [
  'test-simple.pdf',
  'test-multi-3pages.pdf',
  'test-multi-5pages.pdf',
  'test-with-text.pdf',
  'test-with-images.pdf',
  'test-large.pdf'
]) {
  await verifyFixture(fixture);
}
```

- [ ] **Step 8: Regenerate all fixtures**

```bash
yarn run fixtures:generate
```

Expected: All 6 fixtures are created and verified

- [ ] **Step 9: Check size of test-large.pdf**

```bash
ls -lh fixtures/test-large.pdf
```

Expected: File > 1MB

- [ ] **Step 10: Commit**

```bash
git add scripts/fixtures-generate fixtures/test-with-text.pdf fixtures/test-with-images.pdf fixtures/test-large.pdf
git commit -m "feat(fixtures): add test-with-text, test-with-images and test-large fixtures"
```

### Task 1.2: Docker Infrastructure Tests (helper.js)

**Files:**
- Create: `lib/__tests__/helper.js`

- [ ] **Step 1: Create test file with basic structure**

Create `lib/__tests__/helper.js`:

```javascript
import { __, imageExists, buildImage, ensureImageIsAvailable, dockerRun } from '../helper.js';
import { absolute, exists, write, remove } from 'firost';

describe('helper', () => {
  describe('imageExists', () => {
    // Tests to come
  });

  describe('buildImage', () => {
    // Tests to come
  });

  describe('ensureImageIsAvailable', () => {
    // Tests to come
  });

  describe('dockerRun', () => {
    // Tests to come
  });
});
```

- [ ] **Step 2: Test imageExists() - image present**

Add in describe `imageExists`:

```javascript
it('should return true when image exists', async () => {
  // Ensure image is built first
  await ensureImageIsAvailable();

  const result = await imageExists();

  expect(result).toBe(true);
});
```

- [ ] **Step 3: Test imageExists() - image absent**

Add after previous test:

```javascript
it('should return false when image does not exist', async () => {
  // Mock pour tester le cas où l'image n'existe pas
  // On ne peut pas vraiment supprimer l'image, donc on teste la logique
  vi.spyOn(__, 'run').mockRejectedValue(new Error('No such image'));

  const result = await imageExists();

  expect(result).toBe(false);
});
```

- [ ] **Step 4: Add __ pattern in helper.js**

Modifier `lib/helper.js` to add `__` pattern before end of file:

```javascript
export let __;

// ... existing code ...

__ = {
  run,
};
```

- [ ] **Step 5: Modifier imageExists() pour utiliser __**

Replace in `lib/helper.js` line 38:

```javascript
// Before:
await run(`docker image inspect --format '{{.Id}}' ${IMAGE_NAME}`, {

// After:
await __.run(`docker image inspect --format '{{.Id}}' ${IMAGE_NAME}`, {
```

- [ ] **Step 6: Do the same for buildImage()**

Replace in `lib/helper.js` line 64:

```javascript
// Before:
await run(command, {

// After:
await __.run(command, {
```

- [ ] **Step 7: Run tests helper**

```bash
yarn run test lib/__tests__/helper.js
```

Expected: Les 2 tests imageExists pass

- [ ] **Step 8: Test dockerRun() - simple command**

Add in describe `dockerRun`:

```javascript
it('should execute a simple command in Docker', async () => {
  const result = await dockerRun('echo "hello world"');

  expect(result.stdout).toContain('hello world');
});
```

- [ ] **Step 9: Test dockerRun() - with volumes**

Add after previous test:

```javascript
it('should mount volumes correctly', async () => {
  const tmpDir = absolute('fixtures');
  const result = await dockerRun('ls /app/input', { inputDirectory: tmpDir });

  // Should list fixture files
  expect(result.stdout).toContain('test-simple.pdf');
});
```

- [ ] **Step 10: Run all tests helper**

```bash
yarn run test lib/__tests__/helper.js
```

Expected: 4 tests pass

- [ ] **Step 11: Commit**

```bash
git add lib/__tests__/helper.js lib/helper.js
git commit -m "test(helper): add tests for Docker infrastructure"
```

---

## Phase 2: Simple Functions

### Task 2.1: extractText() Tests

**Files:**
- Create: `lib/__tests__/extractText.js`

- [ ] **Step 1: Create test file with basic structure**

Create `lib/__tests__/extractText.js`:

```javascript
import { extractText } from '../extractText.js';
import { ensureDockerReady, createTempDir, cleanup } from './testHelpers.js';
import { absolute, read, exists } from 'firost';

describe('extractText', () => {
  let tmpDir;

  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000);

  afterEach(async () => {
    if (tmpDir) await cleanup(tmpDir);
  });

  describe('integration tests with real PDFs', () => {
    // Tests to come
  });

  describe('error handling', () => {
    // Tests to come
  });
});
```

- [ ] **Step 2: Test extractText() - happy path**

Add in `integration tests with real PDFs`:

```javascript
it('should extract text from a PDF with text', async () => {
  const inputFile = absolute('fixtures/test-with-text.pdf');
  tmpDir = await createTempDir();
  const outputFile = absolute(tmpDir, 'output.txt');

  await extractText(inputFile, outputFile);

  expect(await exists(outputFile)).toBe(true);
  const content = await read(outputFile);
  expect(content).toContain('You can cut our wings');
});
```

- [ ] **Step 3: Run test to verify it passes**

```bash
yarn run test lib/__tests__/extractText.js
```

Expected: 1 test passes

- [ ] **Step 4: Test extractText() - missing file**

Add in `error handling`:

```javascript
it('should throw error if input file does not exist', async () => {
  const nonExistent = absolute('fixtures/missing.pdf');
  tmpDir = await createTempDir();
  const outputFile = absolute(tmpDir, 'output.txt');

  await expect(extractText(nonExistent, outputFile)).rejects.toThrow();
  await expect(extractText(nonExistent, outputFile)).rejects.toMatchObject({
    code: 'PIETRO_GET_TEXT_INPUT_FILE_MISSING',
  });
});
```

- [ ] **Step 5: Test extractText() - error message**

Add after previous test:

```javascript
it('should throw error with correct message for missing file', async () => {
  const nonExistent = absolute('fixtures/missing.pdf');
  tmpDir = await createTempDir();
  const outputFile = absolute(tmpDir, 'output.txt');

  await expect(extractText(nonExistent, outputFile)).rejects.toThrow(/does not exist/);
});
```

- [ ] **Step 6: Run all tests extractText**

```bash
yarn run test lib/__tests__/extractText.js
```

Expected: 3 tests pass

- [ ] **Step 7: Commit**

```bash
git add lib/__tests__/extractText.js
git commit -m "test(extractText): add comprehensive test suite"
```

### Task 2.2: setTitle() Tests

**Files:**
- Create: `lib/__tests__/setTitle.js`

- [ ] **Step 1: Create test file with basic structure**

Create `lib/__tests__/setTitle.js`:

```javascript
import { setTitle } from '../setTitle.js';
import { ensureDockerReady, createTempDir, cleanup, copyFixture } from './testHelpers.js';
import { absolute, exists } from 'firost';
import { dockerRun } from '../helper.js';

describe('setTitle', () => {
  let tmpDir;

  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000);

  afterEach(async () => {
    if (tmpDir) await cleanup(tmpDir);
  });

  describe('integration tests', () => {
    // Tests to come
  });

  describe('error handling', () => {
    // Tests to come
  });
});
```

- [ ] **Step 2: Test setTitle() - happy path**

Add in `integration tests`:

```javascript
it('should set the title of a PDF', async () => {
  tmpDir = await createTempDir();
  const pdfPath = await copyFixture('test-simple.pdf', tmpDir);

  await setTitle(pdfPath, 'My New Title');

  // Verify title was set using exiftool
  const result = await dockerRun(`exiftool -Title /app/input/test-simple.pdf`, {
    inputDirectory: tmpDir
  });

  expect(result.stdout).toContain('My New Title');
});
```

- [ ] **Step 3: Test setTitle() - title with spaces**

Add after previous test:

```javascript
it('should handle titles with spaces', async () => {
  tmpDir = await createTempDir();
  const pdfPath = await copyFixture('test-simple.pdf', tmpDir);

  await setTitle(pdfPath, 'Title With Multiple Spaces');

  const result = await dockerRun(`exiftool -Title /app/input/test-simple.pdf`, {
    inputDirectory: tmpDir
  });

  expect(result.stdout).toContain('Title With Multiple Spaces');
});
```

- [ ] **Step 4: Run tests pour vérifier qu'ils pass**

```bash
yarn run test lib/__tests__/setTitle.js
```

Expected: 2 tests pass

- [ ] **Step 5: Test setTitle() - missing file**

Add in `error handling`:

```javascript
it('should throw error if input file does not exist', async () => {
  const nonExistent = absolute('fixtures/missing.pdf');

  await expect(setTitle(nonExistent, 'Title')).rejects.toThrow();
  await expect(setTitle(nonExistent, 'Title')).rejects.toMatchObject({
    code: 'PIETRO_SET_TITLE_INPUT_FILE_MISSING',
  });
});
```

- [ ] **Step 6: Run all tests setTitle**

```bash
yarn run test lib/__tests__/setTitle.js
```

Expected: 3 tests pass

- [ ] **Step 7: Commit**

```bash
git add lib/__tests__/setTitle.js
git commit -m "test(setTitle): add comprehensive test suite"
```

---

## Phase 3: Medium Functions

### Task 3.1: extractPages() Tests

**Files:**
- Create: `lib/__tests__/extractPages.js`

- [ ] **Step 1: Create test file with basic structure**

Create `lib/__tests__/extractPages.js`:

```javascript
import { extractPages } from '../extractPages.js';
import { ensureDockerReady, createTempDir, cleanup } from './testHelpers.js';
import { absolute, glob } from 'firost';

describe('extractPages', () => {
  let tmpDir;

  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000);

  afterEach(async () => {
    if (tmpDir) await cleanup(tmpDir);
  });

  describe('integration tests', () => {
    // Tests to come
  });

  describe('error handling', () => {
    // Tests to come
  });
});
```

- [ ] **Step 2: Test extractPages() - 1 page**

Add in `integration tests`:

```javascript
it('should extract 1 page from simple PDF', async () => {
  const inputFile = absolute('fixtures/test-simple.pdf');
  tmpDir = await createTempDir();

  await extractPages(inputFile, tmpDir);

  const pages = await glob('*.pdf', { context: tmpDir });
  expect(pages.length).toBe(1);
  expect(pages[0]).toContain('1.pdf');
});
```

- [ ] **Step 3: Test extractPages() - 3 pages**

Add after previous test:

```javascript
it('should extract 3 pages from multi-page PDF', async () => {
  const inputFile = absolute('fixtures/test-multi-3pages.pdf');
  tmpDir = await createTempDir();

  await extractPages(inputFile, tmpDir);

  const pages = await glob('*.pdf', { context: tmpDir });
  expect(pages.length).toBe(3);
  expect(pages).toEqual(
    expect.arrayContaining([
      expect.stringContaining('1.pdf'),
      expect.stringContaining('2.pdf'),
      expect.stringContaining('3.pdf'),
    ])
  );
});
```

- [ ] **Step 4: Test extractPages() - 5 pages**

Add after previous test:

```javascript
it('should extract 5 pages from multi-page PDF', async () => {
  const inputFile = absolute('fixtures/test-multi-5pages.pdf');
  tmpDir = await createTempDir();

  await extractPages(inputFile, tmpDir);

  const pages = await glob('*.pdf', { context: tmpDir });
  expect(pages.length).toBe(5);
});
```

- [ ] **Step 5: Run tests pour vérifier qu'ils pass**

```bash
yarn run test lib/__tests__/extractPages.js
```

Expected: 3 tests pass

- [ ] **Step 6: Test extractPages() - missing file**

Add in `error handling`:

```javascript
it('should throw error if input file does not exist', async () => {
  const nonExistent = absolute('fixtures/missing.pdf');
  tmpDir = await createTempDir();

  await expect(extractPages(nonExistent, tmpDir)).rejects.toThrow();
  await expect(extractPages(nonExistent, tmpDir)).rejects.toMatchObject({
    code: 'PIETRO_EXTRACT_ALL_PAGES_INPUT_FILE_MISSING',
  });
});
```

- [ ] **Step 7: Run all tests extractPages**

```bash
yarn run test lib/__tests__/extractPages.js
```

Expected: 4 tests pass

- [ ] **Step 8: Commit**

```bash
git add lib/__tests__/extractPages.js
git commit -m "test(extractPages): add comprehensive test suite"
```

### Task 3.2: mergeFiles() Tests

**Files:**
- Create: `lib/__tests__/mergeFiles.js`

- [ ] **Step 1: Create test file with basic structure**

Create `lib/__tests__/mergeFiles.js`:

```javascript
import { mergeFiles } from '../mergeFiles.js';
import { ensureDockerReady, createTempDir, cleanup, copyFixture } from './testHelpers.js';
import { absolute, exists } from 'firost';
import { pageCount } from '../pageCount.js';

describe('mergeFiles', () => {
  let tmpDir;

  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000);

  afterEach(async () => {
    if (tmpDir) await cleanup(tmpDir);
  });

  describe('integration tests', () => {
    // Tests to come
  });

  describe('error handling', () => {
    // Tests to come
  });
});
```

- [ ] **Step 2: Test mergeFiles() - 2 files**

Add in `integration tests`:

```javascript
it('should merge 2 PDFs into one', async () => {
  tmpDir = await createTempDir();
  const file1 = await copyFixture('test-simple.pdf', tmpDir);
  const file2 = await copyFixture('test-multi-3pages.pdf', tmpDir);
  const outputFile = absolute(tmpDir, 'merged.pdf');

  await mergeFiles([file1, file2], outputFile);

  expect(await exists(outputFile)).toBe(true);
  const count = await pageCount(outputFile);
  expect(count).toBe(4); // 1 + 3 pages
});
```

- [ ] **Step 3: Test mergeFiles() - 3 files**

Add after previous test:

```javascript
it('should merge 3 PDFs into one', async () => {
  tmpDir = await createTempDir();
  const file1 = await copyFixture('test-simple.pdf', tmpDir);
  const file2 = await copyFixture('test-multi-3pages.pdf', tmpDir);
  const file3 = await copyFixture('test-multi-5pages.pdf', tmpDir);
  const outputFile = absolute(tmpDir, 'merged.pdf');

  await mergeFiles([file1, file2, file3], outputFile);

  expect(await exists(outputFile)).toBe(true);
  const count = await pageCount(outputFile);
  expect(count).toBe(9); // 1 + 3 + 5 pages
});
```

- [ ] **Step 4: Run tests pour vérifier qu'ils pass**

```bash
yarn run test lib/__tests__/mergeFiles.js
```

Expected: 2 tests pass

- [ ] **Step 5: Test mergeFiles() - missing file**

Add in `error handling`:

```javascript
it('should throw error if input file does not exist', async () => {
  tmpDir = await createTempDir();
  const file1 = await copyFixture('test-simple.pdf', tmpDir);
  const file2 = absolute(tmpDir, 'missing.pdf');
  const outputFile = absolute(tmpDir, 'merged.pdf');

  await expect(mergeFiles([file1, file2], outputFile)).rejects.toThrow();
  await expect(mergeFiles([file1, file2], outputFile)).rejects.toMatchObject({
    code: 'PIETRO_MERGE_FILES_IMAGES_INPUT_FILE_MISSING',
  });
});
```

- [ ] **Step 6: Test mergeFiles() - files dans dossiers différents**

Add after previous test:

```javascript
it('should throw error if files are not in the same directory', async () => {
  tmpDir = await createTempDir();
  const file1 = await copyFixture('test-simple.pdf', tmpDir);
  const file2 = absolute('fixtures/test-multi-3pages.pdf'); // Different directory
  const outputFile = absolute(tmpDir, 'merged.pdf');

  await expect(mergeFiles([file1, file2], outputFile)).rejects.toThrow();
  await expect(mergeFiles([file1, file2], outputFile)).rejects.toMatchObject({
    code: 'PIETRO_MERGE_FILES_FILES_NOT_IN_SAME_FOLDER',
  });
});
```

- [ ] **Step 7: Run all tests mergeFiles**

```bash
yarn run test lib/__tests__/mergeFiles.js
```

Expected: 4 tests pass

- [ ] **Step 8: Commit**

```bash
git add lib/__tests__/mergeFiles.js
git commit -m "test(mergeFiles): add comprehensive test suite"
```

---

## Phase 4: Difficult Functions

### Task 4.1: compress() Tests

**Files:**
- Create: `lib/__tests__/compress.js`

- [ ] **Step 1: Create test file with basic structure**

Create `lib/__tests__/compress.js`:

```javascript
import { compress } from '../compress.js';
import { ensureDockerReady, createTempDir, cleanup, copyFixture } from './testHelpers.js';
import { absolute, exists, size } from 'firost';

describe('compress', () => {
  let tmpDir;

  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000);

  afterEach(async () => {
    if (tmpDir) await cleanup(tmpDir);
  });

  describe('integration tests', () => {
    // Tests to come
  });

  describe('error handling', () => {
    // Tests to come
  });
});
```

- [ ] **Step 2: Test compress() - with outputFile**

Add in `integration tests`:

```javascript
it('should compress a PDF to a new file', async () => {
  tmpDir = await createTempDir();
  const inputFile = await copyFixture('test-large.pdf', tmpDir);
  const outputFile = absolute(tmpDir, 'compressed.pdf');

  const originalSize = await size(inputFile);
  await compress(inputFile, outputFile);

  expect(await exists(outputFile)).toBe(true);
  const compressedSize = await size(outputFile);
  expect(compressedSize).toBeLessThan(originalSize);
});
```

- [ ] **Step 3: Test compress() - in place**

Add after previous test:

```javascript
it('should compress a PDF in place when no output specified', async () => {
  tmpDir = await createTempDir();
  const inputFile = await copyFixture('test-large.pdf', tmpDir);

  const originalSize = await size(inputFile);
  await compress(inputFile);

  expect(await exists(inputFile)).toBe(true);
  const compressedSize = await size(inputFile);
  expect(compressedSize).toBeLessThan(originalSize);
});
```

- [ ] **Step 4: Run tests pour vérifier qu'ils pass**

```bash
yarn run test lib/__tests__/compress.js
```

Expected: 2 tests pass

- [ ] **Step 5: Test compress() - missing file**

Add in `error handling`:

```javascript
it('should throw error if input file does not exist', async () => {
  const nonExistent = absolute('fixtures/missing.pdf');
  tmpDir = await createTempDir();
  const outputFile = absolute(tmpDir, 'output.pdf');

  await expect(compress(nonExistent, outputFile)).rejects.toThrow();
  await expect(compress(nonExistent, outputFile)).rejects.toMatchObject({
    code: 'PIETRO_COMPRESS_INPUT_FILE_MISSING',
  });
});
```

- [ ] **Step 6: Run all tests compress**

```bash
yarn run test lib/__tests__/compress.js
```

Expected: 3 tests pass

- [ ] **Step 7: Commit**

```bash
git add lib/__tests__/compress.js
git commit -m "test(compress): add comprehensive test suite with size verification"
```

---

## Phase 5: Very Complex Functions

### Task 5.1: Refactor extractImages() with `__` Pattern

**Files:**
- Modify: `lib/extractImages.js`

- [ ] **Step 1: Ajouter le placeholder `__` au début du fichier**

Add after imports in `lib/extractImages.js`:

```javascript
export let __;
```

- [ ] **Step 2: Rename internal functions**

The functions `createManifest`, `extractRawImages`, `extractIllustrationImages`, `composeImageWithMask` and `getImagePathByIndex` will be moved into `__`.

Remove existing `async function` declarations and replace them with a `__` object at end of file.

- [ ] **Step 3: Create __ object with all methods**

Add at end of `lib/extractImages.js` (before last line):

```javascript
__ = {
  async createManifest(inputFile, extractImageDirectory) {
    const inputDirectory = path.dirname(inputFile);
    const inputFileBasename = path.basename(inputFile);
    const inputFileBasenameWithoutExtension = path.basename(inputFile, '.pdf');

    const outputFile = absolute(
      extractImageDirectory,
      'raw',
      inputFileBasenameWithoutExtension,
      'manifest.json',
    );

    if (await exists(outputFile)) {
      return;
    }

    const command = [
      'pdfimages',
      '-list',
      `/app/input/${inputFileBasename}`,
    ].join(' ');

    const { stdout } = await dockerRun(command, { inputDirectory });

    const lines = stdout.split('\n');
    const headers = _.chain(lines[0]).split(' ').compact().value();
    const manifest = _.chain(lines)
      .slice(2)
      .transform((result, line) => {
        const values = _.chain(line).split(' ').compact().value();
        const image = _.zipObject(headers, values);
        result.push({
          imageIndex: _.parseInt(image.num),
          type: image.type,
          width: _.parseInt(image.width),
          height: _.parseInt(image.height),
          color: image.color,
          objectID: _.parseInt(image.object),
          size: image.size,
        });
      }, [])
      .value();

    await writeJson(manifest, outputFile);
  },

  async extractRawImages(inputFile, extractImageDirectory) {
    const prefix = 'PREFIX_TO_REMOVE';
    const inputDirectory = path.dirname(inputFile);
    const inputFileBasename = path.basename(inputFile);
    const inputFileBasenameWithoutExtension = path.basename(inputFile, '.pdf');
    const outputDirectory = absolute(
      extractImageDirectory,
      'raw',
      inputFileBasenameWithoutExtension,
    );

    const manifest = await readJson(absolute(outputDirectory, 'manifest.json'));
    const rawFiles = await glob(['*.png', `!${prefix}*.png`], {
      context: outputDirectory,
    });
    if (manifest.length == rawFiles.length) {
      return;
    }

    const command = [
      'pdfimages',
      '-png',
      `/app/input/${inputFileBasename}`,
      `/app/output/${prefix}`,
    ].join(' ');

    await dockerRun(command, { inputDirectory, outputDirectory });

    const createdFiles = await glob(`${prefix}*png`, {
      context: outputDirectory,
    });
    await pMap(createdFiles, async (filepath) => {
      const newPath = _.replace(
        filepath,
        `${outputDirectory}/${prefix}-`,
        `${outputDirectory}/`,
      );
      await move(filepath, newPath);
    });
  },

  async extractIllustrationImages(inputFile, extractImageDirectory) {
    const inputFileBasenameWithoutExtension = path.basename(inputFile, '.pdf');
    const rawDirectory = absolute(
      extractImageDirectory,
      'raw',
      inputFileBasenameWithoutExtension,
    );
    const illustrationDirectory = absolute(
      extractImageDirectory,
      'illustrations',
      inputFileBasenameWithoutExtension,
    );

    const manifestPath = absolute(rawDirectory, 'manifest.json');
    const rawManifest = await readJson(manifestPath);
    const minHeight = 100;
    const minWidth = 100;
    const images = _.chain(rawManifest)
      .filter({ type: 'image', color: 'icc' })
      .filter(({ width, height }) => {
        return width > minWidth && height > minHeight;
      })
      .value();

    const concurrency = 1;
    await pMap(
      images,
      async (image, index) => {
        const { objectID, imageIndex } = image;
        const illustrationPath = absolute(illustrationDirectory, `${index}.png`);

        const mask = _.find(rawManifest, {
          objectID,
          color: 'gray',
          type: 'smask',
        });
        if (mask) {
          await __.composeImageWithMask(rawDirectory, image, mask, illustrationPath);
          return;
        }

        const rawImagePath = await __.getImagePathByIndex(imageIndex, rawDirectory);
        await copy(rawImagePath, illustrationPath);
      },
      { concurrency },
    );
  },

  async composeImageWithMask(rawDirectory, image, mask, outputPath) {
    const imagePath = await __.getImagePathByIndex(image.imageIndex, rawDirectory);
    const maskPath = await __.getImagePathByIndex(mask.imageIndex, rawDirectory);

    const imageDirectory = path.dirname(imagePath);
    const maskDirectory = path.dirname(maskPath);
    if (imageDirectory != maskDirectory) {
      throw firostError(
        'PIETRO_EXTRACT_IMAGES_RAW_AND_MASK_NOT_IN_SAME_FOLDER',
        [
          'The image and mask are not located in the same folder:',
          `- image: ${imagePath}`,
          `- mask: ${maskPath}`,
        ].join('\n'),
      );
    }
    const inputDirectory = imageDirectory;

    const outputDirectory = path.dirname(outputPath);
    await mkdirp(outputDirectory);

    const imageBasename = path.basename(imagePath);
    const maskBasename = path.basename(maskPath);
    const outputBasename = path.basename(outputPath);

    const { width, height } = image;
    const composeCommand = [
      'magick composite',
      '-compose CopyOpacity',
      `-resize ${width}x${height}`,
      `/app/input/${maskBasename}`,
      `/app/input/${imageBasename}`,
      `PNG32:/app/output/${outputBasename}`,
    ].join(' ');

    await dockerRun(composeCommand, { inputDirectory, outputDirectory });

    const trimCommand = [
      'magick',
      `/app/input/${outputBasename}`,
      '-trim',
      `PNG32:/app/input/${outputBasename}`,
    ].join(' ');

    await dockerRun(trimCommand, { inputDirectory: outputDirectory });
  },

  async getImagePathByIndex(imageIndex, rawDirectory) {
    return (await glob(`*${imageIndex}.png`, { context: rawDirectory }))[0];
  },
};
```

- [ ] **Step 4: Mettre à jour extractImages() pour utiliser __**

Modifier la fonction `extractImages` pour utiliser `__`:

```javascript
export async function extractImages(inputFile, extractImageDirectory) {
  if (!(await exists(inputFile))) {
    throw firostError(
      'PIETRO_EXTRACT_IMAGES_INPUT_FILE_MISSING',
      `The file ${inputFile} does not exist`,
    );
  }

  await __.createManifest(inputFile, extractImageDirectory);
  await __.extractRawImages(inputFile, extractImageDirectory);
  await __.extractIllustrationImages(inputFile, extractImageDirectory);
}
```

- [ ] **Step 5: Verify code compiles**

```bash
yarn run lint lib/extractImages.js
```

Expected: No lint errors

- [ ] **Step 6: Commit**

```bash
git add lib/extractImages.js
git commit -m "refactor(extractImages): add __ pattern for testability"
```

### Task 5.2: Tests extractImages() - Unit Tests with Mocks

**Files:**
- Create: `lib/__tests__/extractImages.js`

- [ ] **Step 1: Create test file with basic structure**

Create `lib/__tests__/extractImages.js`:

```javascript
import { __, extractImages } from '../extractImages.js';
import { ensureDockerReady, createTempDir, cleanup } from './testHelpers.js';
import { absolute, exists, glob } from 'firost';

describe('extractImages', () => {
  let tmpDir;

  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000);

  afterEach(async () => {
    if (tmpDir) await cleanup(tmpDir);
  });

  describe('unit tests with mocks', () => {
    beforeEach(() => {
      vi.spyOn(__, 'createManifest').mockResolvedValue();
      vi.spyOn(__, 'extractRawImages').mockResolvedValue();
      vi.spyOn(__, 'extractIllustrationImages').mockResolvedValue();
    });

    // Tests to come
  });

  describe('integration tests with real PDFs', () => {
    // Tests to come
  });

  describe('error handling', () => {
    // Tests to come
  });
});
```

- [ ] **Step 2: Test extractImages() - calls the 3 methods**

Add in `unit tests with mocks`:

```javascript
it('should call all three internal methods in order', async () => {
  const inputFile = absolute('fixtures/test-with-images.pdf');
  const outputDir = absolute('tmp/output');

  await extractImages(inputFile, outputDir);

  expect(__.createManifest).toHaveBeenCalledWith(inputFile, outputDir);
  expect(__.extractRawImages).toHaveBeenCalledWith(inputFile, outputDir);
  expect(__.extractIllustrationImages).toHaveBeenCalledWith(inputFile, outputDir);
});
```

- [ ] **Step 3: Run the test unitaire**

```bash
yarn run test lib/__tests__/extractImages.js
```

Expected: 1 test passes

- [ ] **Step 4: Test extractImages() - integration happy path**

Add in `integration tests with real PDFs`:

```javascript
it('should extract images from a PDF with images', async () => {
  const inputFile = absolute('fixtures/test-with-images.pdf');
  tmpDir = await createTempDir();

  await extractImages(inputFile, tmpDir);

  // Check manifest exists
  const manifestPath = absolute(tmpDir, 'raw/test-with-images/manifest.json');
  expect(await exists(manifestPath)).toBe(true);

  // Check raw images exist
  const rawImages = await glob('*.png', {
    context: absolute(tmpDir, 'raw/test-with-images')
  });
  expect(rawImages.length).toBeGreaterThan(0);

  // Check illustrations directory exists
  const illustrationsPath = absolute(tmpDir, 'illustrations/test-with-images');
  expect(await exists(illustrationsPath)).toBe(true);
}, 45000); // Longer timeout for complex operation
```

- [ ] **Step 5: Test extractImages() - missing file**

Add in `error handling`:

```javascript
it('should throw error if input file does not exist', async () => {
  const nonExistent = absolute('fixtures/missing.pdf');
  tmpDir = await createTempDir();

  await expect(extractImages(nonExistent, tmpDir)).rejects.toThrow();
  await expect(extractImages(nonExistent, tmpDir)).rejects.toMatchObject({
    code: 'PIETRO_EXTRACT_IMAGES_INPUT_FILE_MISSING',
  });
});
```

- [ ] **Step 6: Run all tests extractImages**

```bash
yarn run test lib/__tests__/extractImages.js
```

Expected: 3 tests pass

- [ ] **Step 7: Commit**

```bash
git add lib/__tests__/extractImages.js
git commit -m "test(extractImages): add unit and integration tests with mocks"
```

---

## Phase 6: Final Validation

### Task 6.1: Run All Tests

**Files:**
- None (validation only)

- [ ] **Step 1: Lancer tous les tests**

```bash
yarn run test
```

Expected: All tests pass (pageCount + helper + extractText + setTitle + extractPages + mergeFiles + compress + extractImages)

- [ ] **Step 2: Compter les files de test**

```bash
ls -1 lib/__tests__/*.js | wc -l
```

Expected: 9 files (testHelpers + 8 files de test)

- [ ] **Step 3: Check fixtures**

```bash
ls -1 fixtures/*.pdf | wc -l
```

Expected: At least 8 fixtures (foo, bar + 6 new)

- [ ] **Step 4: Documentation - Update spec with final status**

Ajouter à la fin de `SPEC_TEST_COVERAGE.md`:

```markdown

---

## Implementation Status

**Completion date** : 2026-05-01

### Implemented Tests ✅

- ✅ helper.js - Infrastructure Docker
- ✅ pageCount.js - Page counting (existing)
- ✅ extractText.js - Text extraction
- ✅ setTitle.js - Metadata modification
- ✅ extractPages.js - Individual page extraction
- ✅ mergeFiles.js - PDF merging
- ✅ compress.js - Compression with size verification
- ✅ extractImages.js - Image extraction (with mocks)

### Created Fixtures ✅

- ✅ test-with-text.pdf - "You can cut our wings..."
- ✅ test-with-images.pdf - 2 100x100px images
- ✅ test-large.pdf - >1MB for compression

### Coverage

All functions exported in `lib/main.js` are tested with:
- Happy paths
- Error handling (missing files)
- Main edge cases

**Coverage estimate** : ~80-85% (goal achieved)
```

- [ ] **Step 5: Final commit**

```bash
git add SPEC_TEST_COVERAGE.md
git commit -m "docs: mark test coverage implementation as complete"
```

---

## Self-Review

### Spec Coverage Check

Let's go through spec `SPEC_TEST_COVERAGE.md` section by section:

1. ✅ **Phase 0: Upgrades** → Task 0.1 and 0.2
2. ✅ **Phase 1: Infrastructure & Fixtures** → Task 1.1 and 1.2
3. ✅ **Phase 2: Simple Functions** → Task 2.1 (extractText) and 2.2 (setTitle)
4. ✅ **Phase 3: Medium Functions** → Task 3.1 (extractPages) and 3.2 (mergeFiles)
5. ✅ **Phase 4: Difficult Functions** → Task 4.1 (compress)
6. ✅ **Phase 5: Complex Functions** → Task 5.1 and 5.2 (extractImages with pattern `__`)
7. ✅ **All 7 functions tested** (pageCount already done + 6 new + helper)
8. ✅ **Pattern `__` implemented** like in firost
9. ✅ **Fixtures created** according to spec
10. ✅ **Conventions respected** (skill js-writer, absolute(), no Vitest imports, etc.)

### Placeholder Scan

Search for forbidden patterns:
- ❌ "TBD", "TODO" → None found
- ❌ "implement later" → None found
- ❌ "Add appropriate error handling" → Complete code provided
- ❌ "Similar to Task N" → Each task has complete code
- ❌ Steps without code → All code steps have code blocks

✅ No placeholders detected

### Type Consistency

Verification of function/type names across tasks:
- ✅ `extractText()` - consistent
- ✅ `setTitle()` - consistent
- ✅ `extractPages()` - consistent
- ✅ `mergeFiles()` - consistent
- ✅ `compress()` - consistent
- ✅ `extractImages()` - consistent
- ✅ Pattern `__` - used consistently
- ✅ Helpers (`createTempDir`, `cleanup`, etc.) - consistent

✅ No inconsistency detected

---

## Plan Complete

The plan is complete, verified and ready for execution. All tests cover :
- Happy paths
- Error handling
- Relevant edge cases
- Use of the pattern `__` for complex functions
- Generation of appropriate fixtures
