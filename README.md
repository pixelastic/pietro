# π Pietro

Utilities to split PDF files into smaller files, generate thumbnails and extract
textual content.

This module is a wrapper on top of `pdftk`, `xpdf` and other tools to
transform a raw PDF into a format that could be parsed by a machine.

_⚠ This package has been created out of a personal need of sharing those methods
across projects. The default (or sometimes hardcoded) values of some
of the methods make sense to me. If they do not fit your needs, feel free to
open issues or pull requests to adapt the code, I'd be happy to make it more
extensible._

```js
const pdf = await pietro.init('./path/to/file.pdf');

// Split a large file into smaller files
await pdf.extractAllPages('./dist');

// Convert one page to PNG
const page42 = await pietro.init('./dist/0042.pdf');
await page42.toImage('./images/0042.pdf');

// Get textual content of one page
await page42.getText();

// Extract all images from a pdf
await page42.extractImages('./images');
```

## Requirements

The module internally calls command-line tools to do the grunt work. You need
the following commands to be available in your `$PATH`:

- `convert` (from [ImageMagick][1])
- `pdfinfo` (from [Xpdf][2])
- `pdfimages` (from [Xpdf][2])
- `pdftk` (from [PDFToolkit][3])
- `grep` and `sed` (but you most probably already have them)

## Methods

### .init(pathToPdf)

Create a Pietro instance of a given PDF file.

```js
const pdf = await pietro.init('./path/to/file.pdf');
```

### .pageCount()

Get the number of pages in the PDF.

```js
const count = await pdf.pageCount();
console.info(`The file has ${count} pages`);
```

### .getText()

Return textual content from the PDF

```js
const content = await pdf.getText();
```

### .extractPage(pageIndex, destination)

Extract one specific page of the PDF.

```js
await pdf.extractPage(42, './page-42.pdf');
```

### .extractAllPages(destinationDirectory)

Split the PDF into one file per page, in the specified directory.

```js
await pdf.extractAllPages('./pages');
// Will create ./pages/0001.pdf, ./pages/0002.pdf, etc
```

### .toImage(destination)

Convert the PDF to an image. This is better applied on one-page PDFs.

```js
await pdf.toImage('./thumbnail.png');
```

### .extractImages(destinationDirectory)

Extract all images embedded in the PDF into the specified directory.

```js
await pdf.extractImages('./images');
// Will create ./images/000.png, ./images/001.png, etc
```

[1]: https://www.imagemagick.org/script/index.php
[2]: https://www.xpdfreader.com/
[3]: https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
