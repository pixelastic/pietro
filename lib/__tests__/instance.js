const Current = require('../instance.js');
const dependencyChecker = require('../dependencyChecker.js');
const firost = require('firost');

describe('instance', () => {
  const tmpDirectory = './tmp/instance';
  const fixturesDirectory = './fixtures';
  beforeEach(async () => {
    await firost.emptyDir(tmpDirectory);
  });
  describe('pageCount', () => {
    it('should return the number of pages', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);

      const actual = await pdf.pageCount();

      expect(actual).toEqual(2);
    });
    it('should use cached value if asked several times', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);
      jest.spyOn(pdf, 'run');

      await pdf.pageCount();

      expect(pdf.run).toHaveBeenCalledTimes(1);
    });
  });
  describe('getText', () => {
    it('should contain text of the PDF', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);

      const actual = await pdf.getText();

      expect(actual).toContain('foo');
      expect(actual).toContain('bar');
    });
  });
  describe('extractPage', () => {
    it('should extract the specific page', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/page-2.pdf`;

      const actual = await pdf.extractPage(2, output);

      expect(actual).toEqual(true);
      const content = await new Current(output).getText();
      expect(content).toEqual('bar');
    });
    it('should create subdirectories if they do not yet exist', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/subdir/page-2.pdf`;

      await pdf.extractPage(2, output);

      const actual = await new Current(output).getText();
      expect(actual).toEqual('bar');
    });
    it('should not extract if destination already exists', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/page-2.pdf`;
      await firost.write('foo', output);

      await pdf.extractPage(2, output);

      const actual = await firost.read(output);
      expect(actual).toEqual('foo');
    });
    it('should not extract if page is invalid', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);
      const output = `${tmpDirectory}/nope.pdf`;

      const actual = await pdf.extractPage(42, output);

      expect(actual).toEqual(false);

      expect(await firost.exist(output)).toEqual(false);
    });
  });
  describe('extractAllPages', () => {
    it('should create one file per page', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo-bar.pdf`);

      await pdf.extractAllPages(tmpDirectory);

      const contentOne = await new Current(
        `${tmpDirectory}/0001.pdf`
      ).getText();
      expect(contentOne).toEqual('foo');
      const contentTwo = await new Current(
        `${tmpDirectory}/0002.pdf`
      ).getText();
      expect(contentTwo).toEqual('bar');
    });
  });
  describe('toImage', () => {
    it('should create an image of the PDF', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo.pdf`);
      const output = `${tmpDirectory}/foo.png`;

      const actual = await pdf.toImage(output);

      expect(actual).toEqual(true);

      expect(await firost.exist(output)).toEqual(true);
    });
    it('should return false if the destination already exist', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo.pdf`);
      const output = `${tmpDirectory}/foo.png`;
      await firost.write('foo', output);

      const actual = await pdf.toImage(output);

      expect(actual).toEqual(false);
    });
    it('should catch when convert refuses to convert and suggest a workaround', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo.pdf`);
      const output = `${tmpDirectory}/foo.png`;
      jest.spyOn(pdf, 'run').mockImplementation(() => {
        throw new Error('you are not allowed');
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
  describe('extractImages', () => {
    it('should extract all images in specified folder', async () => {
      const pdf = new Current(`${fixturesDirectory}/pdf-image.pdf`);
      const output = `${tmpDirectory}/output`;

      await pdf.extractImages(output);

      expect(await firost.exist(`${output}/000.png`)).toEqual(true);
      expect(await firost.exist(`${output}/001.png`)).toEqual(true);
    });
  });
  describe('imageList', () => {
    const mockList = `page   num  type   width height color comp bpc  enc interp  object ID x-ppi y-ppi size ratio
--------------------------------------------------------------------------------------------
  1     0 image    2625  1688  icc     3   8  jpeg   no        72  0   151   151 45.5K 0.4%
  1     1 smask    2625  1688  gray    1   8  jpx    no        72  0   151   151 8780B 0.2%
  1     2 image     653   845  icc     3   8  jpx    no        42  0   151   151 44.0K 2.7%
  1     3 smask     653   845  gray    1   8  jpeg   no        42  0   151   151 20.7K 3.8%
  1     4 image     892  1024  gray    1   8  jpeg   no        16  0   201   201 19.4K 2.2%`;
    it('should return an array of all images', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo.pdf`);
      jest.spyOn(pdf, 'run').mockReturnValue({ stdout: mockList });

      const actual = await pdf.imageList();

      expect(actual).toBeArray();
    });
    it('should set values to each image', async () => {
      const pdf = new Current(`${fixturesDirectory}/foo.pdf`);
      jest.spyOn(pdf, 'run').mockReturnValue({ stdout: mockList });

      const actual = await pdf.imageList();

      expect(actual[0]).toHaveProperty('pageIndex', 1);
      expect(actual[0]).toHaveProperty('imageIndex', 0);
      expect(actual[0]).toHaveProperty('type', 'image');
      expect(actual[0]).toHaveProperty('width', 2625);
      expect(actual[0]).toHaveProperty('height', 1688);
      expect(actual[0]).toHaveProperty('color', 'icc');
      expect(actual[0]).toHaveProperty('objectID', 72);
      expect(actual[0]).toHaveProperty('size', '45.5K');
    });
  });
});
