# Spec: Pietro Test Coverage - Complete Test Suite

## Objective

Create a comprehensive test suite for Pietro, a PDF manipulation library using Docker. Currently, only the `pageCount()` function is tested (1/7 functions). The goal is to reach **80% code coverage** by testing all exported functions.

### User Stories

- As a developer, I want all CLI calls via Docker to be tested to ensure they work correctly
- As a maintainer, I want fast tests that use smart mocks for read operations
- As a contributor, I want reusable fixtures to test different PDF scenarios
- As a library user, I want the guarantee that each function does what it claims to do

### Success Criteria

- ✅ 80% minimum code coverage
- ✅ All 7 functions exported in `lib/main.js` have tests
- ✅ Docker infrastructure (`helper.js`) is tested
- ✅ Integration tests for all CLI commands (qpdf, ocrmypdf, pdfimages, etc.)
- ✅ Smart mocks for repeated read operations
- ✅ PDF fixtures adapted to each test scenario
- ✅ All tests pass locally with `npm test`
- ✅ Test patterns documented in test files

## Tech Stack

- **Test Framework**: Vitest 4.x (already configured)
- **Runtime**: Node.js (version to upgrade according to aberlaas 2.27.5)
- **Containerization**: Docker (Alpine 3.17.3)
- **Tested Tools**: qpdf, ocrmypdf, pdfimages, pdftotext, pdfunite, exiftool, imagemagick
- **Utilities**:
  - aberlaas: to upgrade to 2.27.5 (currently 2.23.0)
  - firost: to upgrade to 5.8.0 (currently 5.6.1)
  - golgoth: to check latest version (currently 3.0.0)
- **Package Manager**: Yarn 4.12.0

## Commands

```bash
# Run all tests
yarn run test

# Run tests in watch mode
yarn run test:watch

# Run a specific test file
yarn run test lib/__tests__/compress.js

# Generate test fixtures (script name to be renamed to match this command)
yarn run fixtures:generate

# Run CI locally (requires env var to simulate CI)
CI=true yarn run ci
```

**Important note**: No automatic coverage measurement. The goal is to ensure all methods have their happy path + edge cases tested, with a progressive approach.

## Project Structure

```
lib/
├── __tests__/
│   ├── testHelpers.js       → Shared utilities (already existing)
│   ├── helper.js            → Docker infrastructure tests (NEW)
│   ├── pageCount.js         → pageCount tests (EXISTING - already complete)
│   ├── extractText.js       → extractText tests (NEW)
│   ├── setTitle.js          → setTitle tests (NEW)
│   ├── extractPages.js      → extractPages tests (NEW)
│   ├── mergeFiles.js        → mergeFiles tests (NEW)
│   ├── compress.js          → compress tests (NEW)
│   └── extractImages.js     → extractImages tests (NEW)
├── helper.js                → Docker infrastructure
├── pageCount.js            → Count PDF pages
├── extractText.js          → Extract text to .txt
├── setTitle.js             → Modify title metadata
├── extractPages.js         → Extract each page to PDF
├── mergeFiles.js           → Merge multiple PDFs
├── compress.js             → Compress a PDF
├── extractImages.js        → Extract images from a PDF
└── main.js                 → Entry point (exports)

fixtures/
├── test-simple.pdf         → 1 blank page (EXISTING)
├── test-multi-3pages.pdf   → 3 blank pages (EXISTING)
├── test-multi-5pages.pdf   → 5 blank pages (EXISTING)
├── test-with-text.pdf      → PDF with extractable text (NEW)
├── test-with-images.pdf    → PDF with simple images (NEW)
├── test-with-masked-images.pdf → PDF with images + masks (NEW)
├── test-large.pdf          → Uncompressed PDF (>1MB) (NEW)
└── test-malformed.pdf      → PDF with qpdf warnings (NEW)

scripts/
└── fixtures-generate       → Fixture generation script (to rename and extend)
```

## Code Style

### Test Pattern - Level 1: End-to-end Integration Tests

For functions that call Docker directly (full integration tests):

**IMPORTANT**: Use the `js-writer` skill for all JavaScript code.
- No need to import `describe`, `it`, `expect`, `vi`, etc. from Vitest - they are global
- Use `absolute()` from firost instead of `path.resolve()` or `path.join()`
- Use `read()` from firost to read files

```javascript
import { extractText } from '../extractText.js';
import { ensureDockerReady, createTempDir, cleanup } from './testHelpers.js';
import { absolute, read } from 'firost';

describe('extractText', () => {
  let tmpDir;

  beforeAll(async () => {
    await ensureDockerReady();
  }, 60000);

  afterEach(async () => {
    if (tmpDir) await cleanup(tmpDir);
  });

  describe('integration tests with real PDFs', () => {
    it('should extract text from a PDF with text', async () => {
      const inputFile = absolute('fixtures/test-with-text.pdf');
      tmpDir = await createTempDir();
      const outputFile = absolute(tmpDir, 'output.txt');

      await extractText(inputFile, outputFile);

      const content = await read(outputFile);
      expect(content).toContain('You can cut our wings');
    });
  });

  describe('error handling', () => {
    it('should throw error if input file does not exist', async () => {
      const nonExistent = absolute('fixtures/missing.pdf');
      tmpDir = await createTempDir();
      const outputFile = absolute(tmpDir, 'output.txt');

      await expect(extractText(nonExistent, outputFile)).rejects.toThrow();
      await expect(extractText(nonExistent, outputFile)).rejects.toMatchObject({
        code: 'PIETRO_GET_TEXT_INPUT_FILE_MISSING',
      });
    });
  });
});
```

### Test Pattern - Level 2: Mocks via `__` Pattern (firost-style)

For complex functions with internal logic to mock, use the `__` pattern:

**In source code** (`lib/extractImages.js`):
```javascript
import { dockerRun } from './helper.js';

export let __; // Placeholder for mocks

export async function extractImages(inputFile, extractImageDirectory) {
  await __.createManifest(inputFile, extractImageDirectory);
  await __.extractRawImages(inputFile, extractImageDirectory);
  await __.extractIllustrationImages(inputFile, extractImageDirectory);
}

// Assignment at the end - methods defined directly in the object
__ = {
  async createManifest(inputFile, extractImageDirectory) {
    // ... manifest logic
    const command = 'pdfimages -list ...';
    const result = await dockerRun(command, { inputDirectory });
    // ... parse and save manifest.json
  },

  async extractRawImages(inputFile, extractImageDirectory) {
    // ... raw extraction logic
    const command = 'pdfimages -png ...';
    await dockerRun(command, { inputDirectory, outputDirectory });
    // ... rename files
  },

  async extractIllustrationImages(inputFile, extractImageDirectory) {
    // ... filtering and compositing logic
    const manifest = await readJson(manifestPath);
    // ... filter ICC images > 100x100
    // ... apply masks if necessary
  },
};
```

**In tests** (`lib/__tests__/extractImages.js`):
```javascript
import { __, extractImages } from '../extractImages.js';
import { absolute } from 'firost';

describe('extractImages', () => {
  beforeEach(() => {
    vi.spyOn(__, 'createManifest').mockResolvedValue();
    vi.spyOn(__, 'extractRawImages').mockResolvedValue();
    vi.spyOn(__, 'extractIllustrationImages').mockResolvedValue();
  });

  it('should call all three internal methods in order', async () => {
    const inputFile = absolute('fixtures/test-with-images.pdf');
    const outputDir = absolute('tmp/output');

    await extractImages(inputFile, outputDir);

    expect(__.createManifest).toHaveBeenCalledWith(inputFile, outputDir);
    expect(__.extractRawImages).toHaveBeenCalledWith(inputFile, outputDir);
    expect(__.extractIllustrationImages).toHaveBeenCalledWith(inputFile, outputDir);
  });
});
```

### Conventions

- **Required skill**: Use the `js-writer` skill for all JavaScript code
- **Vitest imports**: DO NOT import `describe`, `it`, `expect`, `vi` - they are global
- **Paths**: Use `absolute()` from firost instead of `path.resolve()` or `path.join()`
- **Reading files**: Use `read()` from firost instead of `fs.readFile`
- **Mock pattern**: Use the `__` (double underscore) pattern inspired by firost
- **Test file names**: `lib/__tests__/[functionName].js` (camelCase)
- **Describe structure**:
  - First level: tested function name
  - Second level: "integration tests", "error handling", "edge cases", etc.
- **Test names**: Start with "should" + action verb
- **beforeAll**: Always `ensureDockerReady()` for integration tests
- **Timeouts**: 30s for Docker tests, 60s for beforeAll (image build)
- **Cleanup**: Always clean temporary files in afterEach

## Testing Strategy

### Framework & Configuration

- **Vitest 4.x** with configuration in `vite.config.js`
- Pool: `forks` for test isolation
- Parallelization enabled (`singleFork: false`)
- Timeouts: 30s per test, 10s for hooks

### Test Levels & Strategy

| Level | Type | When to use | Example |
|--------|------|------------------|---------|
| **E2E Integration** | Real Docker call | Functions that call `dockerRun()` directly | `pageCount()`, `extractText()`, `compress()` |
| **Unit with Mocks** | Mock `dockerRun()` | Composed functions that call Docker multiple times | `extractImages()` (3 internal Docker calls) |
| **Unit Pure** | No mocks | Helper functions, utilities | `testHelpers.js` |

### Fixtures Strategy

Create minimal and targeted fixtures:

- **test-simple.pdf**: 1 blank page (EXISTING)
- **test-multi-3pages.pdf**: 3 blank pages (EXISTING)
- **test-multi-5pages.pdf**: 5 blank pages (EXISTING)
- **test-with-text.pdf**: PDF with text "You can cut our wings, but we will always remember what it was like to fly." (NEW)
- **test-with-images.pdf**: PDF with 2-3 simple 100x100px ICC images for `extractImages()` (NEW)
- **test-with-masked-images.pdf**: PDF with image + smask to test ImageMagick compositing (NEW)
- **test-large.pdf**: Uncompressed PDF >1MB to test `compress()` (NEW)
- **test-malformed.pdf**: PDF with qpdf warnings (exit code 3) for `extractPages()` - exact malformation type to be determined (NEW)

### Coverage Target

- **Approach**: No automatic coverage measurement (no `--coverage`)
- **Qualitative goal**: All functions exported in `lib/main.js` must have:
  - Happy path tested
  - Main edge cases tested
  - Error handling tested
- **Progression**: Progressive test addition over time
- **Estimate**: Aim for ~80% effective coverage, but without strict metrics

### Test Execution Order

Tests are independent and can run in parallel. Suggested implementation order:

1. `helper.js` - Docker infrastructure
2. `extractText.js` - Simple (1 input → 1 output)
3. `setTitle.js` - Simple (metadata modification)
4. `extractPages.js` - Medium (error handling)
5. `mergeFiles.js` - Medium (multiple input validation)
6. `compress.js` - Medium (file size verification)
7. `extractImages.js` - Complex (multiple steps, mocks)

## Boundaries

### Always Do

- ✅ Execute `ensureDockerReady()` in `beforeAll` for integration tests
- ✅ Clean temporary files in `afterEach` with `cleanup(tmpDir)`
- ✅ Test error cases (missing file, invalid file)
- ✅ Verify firost error codes (e.g., `PIETRO_*_INPUT_FILE_MISSING`)
- ✅ Use `createTempDir()` for temporary outputs
- ✅ Verify output content, not just existence
- ✅ Reuse helpers from `testHelpers.js`
- ✅ Add timeouts for slow Docker tests

### Ask First

- ⚠️ Create new fixtures not specified in the spec
- ⚠️ Modify Vitest configuration in `vite.config.js`
- ⚠️ Add new test dependencies
- ⚠️ Change test file structure
- ⚠️ Substantially modify the `fixtures-generate` script
- ⚠️ Upgrade aberlaas, firost or golgoth versions (to do but ask first)

### Never Do

- ❌ Commit large PDF files (>10MB) in fixtures/
- ❌ Mock `dockerRun()` for low-level integration tests
- ❌ Skip failing tests without understanding why
- ❌ Create temporary files without cleaning them
- ❌ Test multiple functions in a single test file
- ❌ Use non-deterministic fixtures (dates, random, etc.)
- ❌ Disable timeouts without justification

## Implementation Plan (High-Level)

### Phase 0: Upgrades & Setup (PREREQUISITES)

- Upgrade aberlaas to 2.27.5
- Upgrade firost to 5.8.0
- Check and upgrade golgoth if needed
- Adjust Node.js version according to aberlaas requirements
- Rename `scripts/generateFixtures.js` → `scripts/fixtures-generate`

### Phase 1: Infrastructure & Fixtures (FOUNDATIONS)

- Extend `scripts/fixtures-generate` to create all needed fixtures
- Test `helper.js` to validate Docker infrastructure
- Validate that all fixtures are properly generated and valid

### Phase 2: Simple Functions (QUICK WINS)

- `extractText()` - Simple integration tests
- `setTitle()` - Integration tests + metadata verification

### Phase 3: Medium Functions (COMPLEX VALIDATION)

- `extractPages()` - Malformed PDF handling
- `mergeFiles()` - Multiple input validation
- `compress()` - File size verification

### Phase 4: Complex Functions (CHALLENGE)

- `extractImages()` - Multiple steps, mocks, structure validation

### Phase 5: Coverage & Polish

- Check coverage with `npm test -- --coverage`
- Fill gaps up to 80%
- Final documentation

## Open Questions

### Resolved ✅

- ~~Coverage target~~ → 80%
- ~~helper.js tests~~ → Yes, need them
- ~~compress performance tests~~ → Yes, verify size reduction
- ~~New fixtures~~ → Yes, need to create them
- ~~Mocks vs E2E~~ → E2E for low level, mocks for composed functions
- ~~Text content~~ → "You can cut our wings, but we will always remember what it was like to fly."
- ~~Fixture images~~ → 100x100px is enough
- ~~Compression threshold~~ → Just verify compressed < original (no specific %)

### Pending ⏳

1. **Malformed PDF**: What type of malformation for `test-malformed.pdf`? (just qpdf warnings or real corruption?)
   - Goal: Test that `extractPages()` properly handles exit code 3 (warnings)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|--------|--------|------------|
| Docker tests too slow | CI timeouts, degraded DX | Smart mocks for composed functions |
| Fixtures too large | Bloated repo, slow clones | Minimal fixtures (<100KB each) |
| Flaky Docker tests | Intermittent CI failures | Generous timeouts, retry logic if needed |
| Insufficient coverage | <80% | Prioritize happy paths, document gaps |
| `extractImages()` too complex | Fragile tests | Break into separately testable sub-functions |

## Next Steps

1. **Validation of this spec** by maintainer ✋
2. Create detailed implementation plan (Phase 2)
3. Break down into atomic tasks (Phase 3)
4. Progressive implementation (Phase 4)

---

**Version**: 1.0
**Date**: 2026-05-01
**Author**: Claude Code
**Status**: Awaiting validation
