import Module from '../instance.js';
import dependencyChecker from '../dependencyChecker.js';
import firost from 'firost';

describe('instance', () => {
  const tmpDirectory = './tmp/instance';
  const fixturesDirectory = './fixtures';
  beforeEach(async () => {
    await firost.emptyDir(tmpDirectory);
  });
  describe('pageCount', () => {
    it('should return the number of pages', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);

      const actual = await pdf.pageCount();

      expect(actual).toEqual(2);
    });
    it('should use cached value if asked several times', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);
      jest.spyOn(firost, 'shell');

      await pdf.pageCount();

      expect(firost.shell).toHaveBeenCalledTimes(1);
    });
  });
  describe('getText', () => {
    it('should contain text of the PDF', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);

      const actual = await pdf.getText();

      expect(actual).toContain('foo');
      expect(actual).toContain('bar');
    });
  });
  describe('extractPage', () => {
    it('should extract the specific page', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/page-2.pdf`;

      const actual = await pdf.extractPage(2, output);

      expect(actual).toEqual(true);
      const content = await new Module(output).getText();
      expect(content).toEqual('bar');
    });
    it('should create subdirectories if they do not yet exist', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/subdir/page-2.pdf`;

      await pdf.extractPage(2, output);

      const actual = await new Module(output).getText();
      expect(actual).toEqual('bar');
    });
    it('should not extract if destination already exists', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/page-2.pdf`;
      await firost.write('foo', output);

      await pdf.extractPage(2, output);

      const actual = await firost.read(output);
      expect(actual).toEqual('foo');
    });
    it('should not extract if page is invalid', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/nope.pdf`;

      const actual = await pdf.extractPage(42, output);

      expect(actual).toEqual(false);

      expect(await firost.exist(output)).toEqual(false);
    });
  });
  describe('extractAllPages', () => {
    it('should create one file per page', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo-bar.pdf`);

      const actual = await pdf.extractAllPages(tmpDirectory);

      const content = await new Module(`${tmpDirectory}/0002.pdf`).getText();
      expect(content).toEqual('bar');
      expect(await firost.exist(`${tmpDirectory}/0001.pdf`)).toEqual(true);
      expect(actual).toEqual(true);
    });
  });
  describe('toImage', () => {
    it('should create an image of the PDF', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo.pdf`);
      const output = `${tmpDirectory}/foo.png`;

      const actual = await pdf.toImage(output);

      expect(actual).toEqual(true);

      expect(await firost.exist(output)).toEqual(true);
    });
    it('should return false if the destination already exist', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo.pdf`);
      const output = `${tmpDirectory}/foo.png`;
      await firost.write('foo', output);

      const actual = await pdf.toImage(output);

      expect(actual).toEqual(false);
    });
    it('should catch when convert refuses to convert and suggest a workaround', async () => {
      const pdf = new Module(`${fixturesDirectory}/foo.pdf`);
      const output = `${tmpDirectory}/foo.png`;
      jest.spyOn(firost, 'shell').mockImplementation(() => {
        throw new Error('you are not authorized');
      });
      jest
        .spyOn(dependencyChecker, 'error')
        .mockReturnValue({ message: 'instructions' });
      jest.spyOn(pdf, '__exit').mockReturnValue();
      jest.spyOn(console, 'info').mockReturnValue();

      await pdf.toImage(output);

      expect(pdf.__exit).toHaveBeenCalledWith('instructions');
    });
  });
});
