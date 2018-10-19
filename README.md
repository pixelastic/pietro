# π Pietro

Utilities to split PDF files into smaller files, generate thumbnails and extract
textual content.

This module is a wrapper on top of `pdftk`, Apache Tika and other tools to
transform a raw PDF into a format that could be parsed by a machine. My main
use-case was to push the content to an Algolia index.

_⚠ This package has been created out of a personal need of sharing those methods
across projects. The default (or sometimes hardcoded) values of some
of the methods make sense to me. If they do not fit your needs, feel free to
open issues or pull requests to adapt the code, I'd be happy to make it more
extensible._

```js
const pdf = pietro.init('./path/to/file.pdf');

// Split a large file into smaller files
await pdf.toIndividualPages('./dist');

// Convert one page to PNG
const page42 = pietro.init('./dist/0042.pdf');
await page42.toImage('./images/0042.pdf');

// Convert one page to text
await page42.toText('./text/0042.txt');
```

# Requirements

The module internally calls command-line tools to do the grunt work. You need
the following commands to be available in your `$PATH`:

- `convert` (from [ImageMagick](https://www.imagemagick.org/script/index.php))
- `pdfinfo` (from [Xpdf](https://www.xpdfreader.com/))
- `pdftk` (from
  [PDFToolkit](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/))
- `grep` and `sed` (but you most probably already have them)

You'll also need `java` available, and the environment variable `TIKA_JAR` set
to the path to the Apache Tika `.jar` file (that you can download from
[here](https://tika.apache.org/download.html))

# Methods

## init(pathToPdf)

Create a Pietro instance of a given PDF file.

```js
const pdf = pietro.init('./path/to/file.pdf');
```

## extractPage(pageIndex, destination)

Extract one specific page of the PDF.

```js
await pdf.extractPage(42, './page-42.pdf');
```

## pageCount()

Get the number of pages in the PDF.

```js
const count = await pdf.pageCount();
console.info(`The file has ${count} pages`);
```

## toIndividualPages(destinationDirectory)

Split the PDF into one file per page, in the specified directory.

```js
await pdf.toIndividualPages('./pages');
// Will create ./pages/0001.pdf, ./pages/0002.pdf, etc
```

## toImage(destination)

Convert the PDF to an image. This is better applied on one-page PDFs.

```js
await pdf.toImage('./thumbnail.png');
```

## toText(destination)

Extract textual content from the PDF into its own file.

```js
await pdf.toText('./content.txt');


